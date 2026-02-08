import * as cheerio from 'cheerio'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { BehanceCacheFile, BehanceProject, BehanceProjectDetail } from '@/lib/behance-types'
import { manualProjects } from '@/lib/manualProjects'

const DEFAULT_PROFILE_URL = 'https://www.behance.net/nadayasser28'
const REVALIDATE_SECONDS = 60 * 60 * 24
const MAX_PROJECTS = 50
const STATIC_CACHE_PATH = path.join(process.cwd(), 'public', 'behance-cache.json')
const PROJECTS_DIR = path.join(process.cwd(), 'public', 'projects')

const DEV_CACHE_TTL_MS = 1000 * 60 * 30
const DEV_CACHE_MAX = 50
const devCache = new Map<string, { value: unknown; expiresAt: number }>()

const isDev = process.env.NODE_ENV !== 'production'

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function getDevCache<T>(key: string): T | null {
  if (!isDev) return null
  const cached = devCache.get(key)
  if (!cached) return null
  if (Date.now() > cached.expiresAt) {
    devCache.delete(key)
    return null
  }
  devCache.delete(key)
  devCache.set(key, cached)
  return cached.value as T
}

function setDevCache<T>(key: string, value: T) {
  if (!isDev) return
  devCache.set(key, { value, expiresAt: Date.now() + DEV_CACHE_TTL_MS })
  if (devCache.size > DEV_CACHE_MAX) {
    const firstKey = devCache.keys().next().value
    if (firstKey) devCache.delete(firstKey)
  }
}

function normalizeProfileUrl(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`
  } catch {
    return url
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureAbsoluteUrl(url: string, baseUrl: string) {
  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return url
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function extractProjectIdFromUrl(url: string) {
  try {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] === 'gallery' && segments[1] && /\d+/.test(segments[1])) {
      return segments[1]
    }
  } catch {
    return undefined
  }
  return undefined
}

export function projectSlugFromUrl(url: string, title?: string) {
  const id = extractProjectIdFromUrl(url)
  try {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    const base = slugify(lastSegment || title || 'project')
    if (id && !base.startsWith(id)) {
      return `${id}-${base}`
    }
    return base || (id ? `project-${id}` : 'project')
  } catch {
    const fallback = slugify(title || 'project')
    return id ? `${id}-${fallback || 'project'}` : fallback
  }
}

function parseCount(value?: string) {
  if (!value) return undefined
  const cleaned = value.replace(/,/g, '').trim().toLowerCase()
  const match = cleaned.match(/([\d.]+)\s*([km])?/)
  if (!match) return undefined
  let num = Number.parseFloat(match[1])
  if (Number.isNaN(num)) return undefined
  if (match[2] === 'k') num *= 1000
  if (match[2] === 'm') num *= 1000000
  return Math.round(num)
}

function coerceNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') return parseCount(value)
  return undefined
}

function parseSrcset(srcset?: string) {
  if (!srcset) return undefined
  const first = srcset.split(',')[0]?.trim()
  if (!first) return undefined
  return first.split(' ')[0]
}

function normalizeStringArray(value: unknown) {
  if (!value) return undefined
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string') as string[]
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return undefined
}

function extractImageFromElement($: cheerio.CheerioAPI, element: cheerio.Element, baseUrl: string) {
  const el = $(element)
  const img = el.find('img').first()
  const src =
    img.attr('src') ||
    img.attr('data-src') ||
    img.attr('data-original') ||
    parseSrcset(img.attr('srcset') || img.attr('data-srcset'))

  if (src) return ensureAbsoluteUrl(src, baseUrl)

  const source = el.find('source').first()
  const sourceSrc = source.attr('srcset') || source.attr('data-srcset')
  if (sourceSrc) {
    const parsed = parseSrcset(sourceSrc)
    if (parsed) return ensureAbsoluteUrl(parsed, baseUrl)
  }

  const style = el.attr('style')
  if (style) {
    const match = style.match(/url\(['"]?(.*?)['"]?\)/i)
    if (match?.[1]) return ensureAbsoluteUrl(match[1], baseUrl)
  }

  return undefined
}

function extractStatsFromCard($: cheerio.CheerioAPI, element: cheerio.Element) {
  const stats: { appreciations?: number; views?: number; comments?: number } = {}
  const statNodes = $(element).find('[title], [aria-label], [data-stat]')

  statNodes.each((_, node) => {
    const label = (
      $(node).attr('title') ||
      $(node).attr('aria-label') ||
      $(node).attr('data-stat') ||
      ''
    ).toLowerCase()

    const valueText = $(node).text().trim()
    if (!valueText) return

    if (label.includes('appreciation')) {
      stats.appreciations = stats.appreciations ?? parseCount(valueText)
    } else if (label.includes('view')) {
      stats.views = stats.views ?? parseCount(valueText)
    } else if (label.includes('comment')) {
      stats.comments = stats.comments ?? parseCount(valueText)
    }
  })

  const classNodes = $(element).find('[class*="Appreciation"], [class*="View"], [class*="Comment"]')
  classNodes.each((_, node) => {
    const classes = ($(node).attr('class') || '').toLowerCase()
    const valueText = $(node).text().trim()
    if (!valueText) return

    if (classes.includes('appreciation')) {
      stats.appreciations = stats.appreciations ?? parseCount(valueText)
    } else if (classes.includes('view')) {
      stats.views = stats.views ?? parseCount(valueText)
    } else if (classes.includes('comment')) {
      stats.comments = stats.comments ?? parseCount(valueText)
    }
  })

  return stats
}

function pickCoverFromObject(obj: Record<string, unknown>) {
  const direct =
    (obj.coverImageUrl as string | undefined) ||
    (obj.cover_image_url as string | undefined) ||
    (obj.cover as string | undefined) ||
    (obj.cover_image as string | undefined)

  if (direct) return direct

  const covers = obj.covers as Record<string, string> | undefined
  if (covers && typeof covers === 'object') {
    const keys = Object.keys(covers).sort((a, b) => Number(b) - Number(a))
    for (const key of keys) {
      const value = covers[key]
      if (typeof value === 'string') return value
    }
  }

  return undefined
}

function collectProjectsFromObject(
  value: unknown,
  baseUrl: string,
  seen: Set<string>,
  results: BehanceProject[]
) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectProjectsFromObject(entry, baseUrl, seen, results))
    return
  }

  if (!value || typeof value !== 'object') return

  const record = value as Record<string, unknown>
  const url = typeof record.url === 'string' ? record.url : undefined
  if (url && url.includes('/gallery/')) {
    const title =
      (record.title as string | undefined) ||
      (record.name as string | undefined) ||
      (record.projectTitle as string | undefined)

    if (title) {
      const absoluteUrl = ensureAbsoluteUrl(url, baseUrl)
      if (!seen.has(absoluteUrl)) {
        const stats = record.stats as Record<string, unknown> | undefined
        const appreciations = coerceNumber(
          record.appreciations ?? record.appreciation_count ?? stats?.appreciations ?? stats?.appreciation_count
        )
        const views = coerceNumber(record.views ?? record.view_count ?? stats?.views ?? stats?.view_count)
        const comments = coerceNumber(
          record.comments ?? record.comment_count ?? stats?.comments ?? stats?.comment_count
        )

        seen.add(absoluteUrl)
        const coverImageUrl = pickCoverFromObject(record)

        results.push({
          id: (record.id as string | undefined) ?? extractProjectIdFromUrl(absoluteUrl),
          title,
          url: absoluteUrl,
          slug: projectSlugFromUrl(absoluteUrl, title),
          coverImageUrl: coverImageUrl ? ensureAbsoluteUrl(coverImageUrl, baseUrl) : undefined,
          fields: normalizeStringArray(record.fields ?? record.tags),
          appreciations,
          views,
          comments,
        })
      }
    }
  }

  Object.values(record).forEach((entry) => collectProjectsFromObject(entry, baseUrl, seen, results))
}

function extractProjectsFromHtml(html: string, baseUrl: string) {
  const $ = cheerio.load(html)
  const results: BehanceProject[] = []
  const seen = new Set<string>()

  const nextData = $('#__NEXT_DATA__').text().trim()
  if (nextData) {
    try {
      const parsed = JSON.parse(nextData)
      collectProjectsFromObject(parsed, baseUrl, seen, results)
    } catch (error) {
      console.warn('Behance: failed to parse __NEXT_DATA__', error)
    }
  }

  $('script').each((_, script) => {
    const content = $(script).html() || ''
    if (!content.includes('__INITIAL_STATE__') && !content.includes('__PRELOADED_STATE__')) return

    const match = content.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/)
      ?? content.match(/__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});/)

    if (match?.[1]) {
      try {
        const parsed = JSON.parse(match[1])
        collectProjectsFromObject(parsed, baseUrl, seen, results)
      } catch (error) {
        console.warn('Behance: failed to parse embedded state', error)
      }
    }
  })

  const cardSelectors = [
    '[data-project-id]',
    '[data-project]',
    '.ProjectCover',
    '.ProjectCoverNeue',
    '.ProjectCover-link',
    'a[href*="/gallery/"]',
  ]

  const cards = $(cardSelectors.join(','))

  cards.each((_, element) => {
    const el = $(element)
    const link = el.is('a') ? el : el.find('a[href*="/gallery/"]').first()
    const href = link.attr('href')
    if (!href) return

    const url = ensureAbsoluteUrl(href, baseUrl)
    if (seen.has(url)) return

    const title =
      link.attr('title') ||
      el.find('[class*="Title"], [class*="title"]').first().text().trim() ||
      link.find('img').attr('alt') ||
      link.text().trim()

    if (!title) return

    const coverImageUrl =
      extractImageFromElement($, el.get(0), baseUrl) ||
      extractImageFromElement($, link.get(0), baseUrl)

    const stats = extractStatsFromCard($, el.get(0))

    let dataProjectFields: string[] | undefined
    let dataProjectCover: string | undefined
    let dataProjectStats: { appreciations?: number; views?: number; comments?: number } | undefined
    const dataProject = el.attr('data-project')
    if (dataProject) {
      try {
        const parsed = JSON.parse(dataProject) as Record<string, unknown>
        dataProjectFields = normalizeStringArray(parsed.fields ?? parsed.tags)
        dataProjectCover = pickCoverFromObject(parsed)
        dataProjectStats = {
          appreciations: coerceNumber(parsed.appreciations ?? parsed.appreciation_count),
          views: coerceNumber(parsed.views ?? parsed.view_count),
          comments: coerceNumber(parsed.comments ?? parsed.comment_count),
        }
      } catch {
        dataProjectFields = undefined
      }
    }

    const dataFields = el.attr('data-fields') || ''
    const fields = dataFields
      ? dataFields.split(',').map((field) => field.trim()).filter(Boolean)
      : dataProjectFields

    seen.add(url)
    results.push({
      id: el.attr('data-project-id') || extractProjectIdFromUrl(url),
      title,
      url,
      slug: projectSlugFromUrl(url, title),
      coverImageUrl: coverImageUrl || (dataProjectCover ? ensureAbsoluteUrl(dataProjectCover, baseUrl) : undefined),
      fields,
      appreciations: stats.appreciations ?? dataProjectStats?.appreciations,
      views: stats.views ?? dataProjectStats?.views,
      comments: stats.comments ?? dataProjectStats?.comments,
    })
  })

  const nextLink =
    $('a[rel="next"]').attr('href') ||
    $('a[aria-label*="Next" i]').attr('href') ||
    $('a:contains("Next")').attr('href')

  const nextPageUrl = nextLink ? ensureAbsoluteUrl(nextLink, baseUrl) : undefined

  return { projects: results, nextPageUrl }
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Behance fetch failed: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

async function scrapeProfileProjects(profileUrl: string, max: number) {
  const results: BehanceProject[] = []
  const seenProjects = new Set<string>()
  const seenPages = new Set<string>()

  let pageUrl: string | undefined = profileUrl

  while (pageUrl && results.length < max) {
    if (seenPages.has(pageUrl)) break
    seenPages.add(pageUrl)

    const html = await fetchHtml(pageUrl)
    const { projects, nextPageUrl } = extractProjectsFromHtml(html, pageUrl)

    projects.forEach((project) => {
      if (!seenProjects.has(project.url) && results.length < max) {
        seenProjects.add(project.url)
        results.push(project)
      }
    })

    if (nextPageUrl && !seenPages.has(nextPageUrl) && results.length < max) {
      pageUrl = nextPageUrl
      await sleep(250)
    } else {
      pageUrl = undefined
    }
  }

  return results
}

async function readBehanceCacheFile() {
  try {
    const data = await fs.readFile(STATIC_CACHE_PATH, 'utf-8')
    return JSON.parse(data) as BehanceCacheFile
  } catch {
    return null
  }
}

export async function writeBehanceCacheFile(data: BehanceCacheFile) {
  await fs.mkdir(path.dirname(STATIC_CACHE_PATH), { recursive: true })
  await fs.writeFile(STATIC_CACHE_PATH, JSON.stringify(data, null, 2))
}

export async function getBehanceProjects(options: {
  profileUrl?: string
  max?: number
  forceRefresh?: boolean
} = {}) {
  const profileUrl = normalizeProfileUrl(options.profileUrl ?? process.env.BEHANCE_PROFILE_URL ?? DEFAULT_PROFILE_URL)
  const max = options.max ?? MAX_PROJECTS
  const forceRefresh = options.forceRefresh ?? false

  const cacheKey = `projects:${profileUrl}`

  if (!forceRefresh) {
    if (process.env.BEHANCE_STATIC_CACHE === '1') {
      const cached = await readBehanceCacheFile()
      if (cached?.projects?.length) {
        return cached.projects
      }
    }

    const cached = getDevCache<BehanceProject[]>(cacheKey)
    if (cached) return cached
  }

  try {
    const projects = await scrapeProfileProjects(profileUrl, max)
    if (projects.length > 0) {
      setDevCache(cacheKey, projects)
      return projects
    }
    console.warn('Behance: no projects parsed, using manual fallback.')
  } catch (error) {
    console.error('Behance: failed to fetch profile projects', error)
  }

  return manualProjects
}

function extractText($: cheerio.CheerioAPI, selector: string) {
  const text = $(selector).first().text().trim()
  return text || undefined
}

function extractMeta($: cheerio.CheerioAPI, selector: string) {
  const value = $(selector).attr('content')?.trim()
  return value || undefined
}

function extractImagesFromLdJson($: cheerio.CheerioAPI) {
  const images: string[] = []
  const scripts = $('script[type="application/ld+json"]')

  scripts.each((_, script) => {
    const text = $(script).html()
    if (!text) return

    try {
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      items.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const image = (item as Record<string, unknown>).image
        if (typeof image === 'string') {
          images.push(image)
        } else if (Array.isArray(image)) {
          image.forEach((img) => {
            if (typeof img === 'string') {
              images.push(img)
            } else if (img && typeof img === 'object') {
              const url = (img as Record<string, unknown>).url || (img as Record<string, unknown>).contentUrl
              if (typeof url === 'string') images.push(url)
            }
          })
        } else if (image && typeof image === 'object') {
          const url = (image as Record<string, unknown>).url || (image as Record<string, unknown>).contentUrl
          if (typeof url === 'string') images.push(url)
        }
      })
    } catch {
      return
    }
  })

  return images
}

function extractTagsFromLdJson($: cheerio.CheerioAPI) {
  const tags: string[] = []
  const scripts = $('script[type="application/ld+json"]')

  scripts.each((_, script) => {
    const text = $(script).html()
    if (!text) return

    try {
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      items.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const keywords = (item as Record<string, unknown>).keywords
        if (typeof keywords === 'string') {
          keywords
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean)
            .forEach((keyword) => tags.push(keyword))
        } else if (Array.isArray(keywords)) {
          keywords.forEach((keyword) => {
            if (typeof keyword === 'string') tags.push(keyword)
          })
        }
      })
    } catch {
      return
    }
  })

  return tags
}

function extractImagesFromHtml(html: string) {
  const matches = html.match(/https:\/\/(mir-s3-cdn-cf\.behance\.net|mir-cdn\.behance\.net|mir-cdn-cf\.behance\.net|a\d+\.behance\.net)\/[^"'\s)]+/g) || []
  return matches.filter((url) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url))
}

export async function getBehanceProjectDetail(
  projectUrl: string,
  options: { forceRefresh?: boolean; slug?: string } = {}
): Promise<BehanceProjectDetail | null> {
  const forceRefresh = options.forceRefresh ?? false
  const cacheKey = `detail:${projectUrl}`

  // Try to read from local meta.json first if using static cache
  if (!forceRefresh && process.env.BEHANCE_STATIC_CACHE === '1' && options.slug) {
    try {
      const metaPath = path.join(PROJECTS_DIR, options.slug, 'meta.json')
      const metaData = await fs.readFile(metaPath, 'utf-8')
      const meta = JSON.parse(metaData) as {
        title: string
        localCoverPath?: string
        localGalleryPaths?: string[]
        fields?: string[]
      }

      if (meta.localGalleryPaths && meta.localGalleryPaths.length > 0) {
        return {
          title: meta.title,
          description: undefined,
          tags: meta.fields,
          images: meta.localGalleryPaths,
          coverImageUrl: meta.localCoverPath,
          localImages: meta.localGalleryPaths,
        }
      }
    } catch {
      // Fall through to remote fetch
    }
  }

  if (!forceRefresh) {
    const cached = getDevCache<BehanceProjectDetail>(cacheKey)
    if (cached) return cached
  }

  try {
    const html = await fetchHtml(projectUrl)
    const $ = cheerio.load(html)

    const title =
      extractMeta($, 'meta[property="og:title"]') ||
      extractText($, 'h1') ||
      extractText($, 'title') ||
      'Behance Project'

    const description =
      extractMeta($, 'meta[property="og:description"]') ||
      extractMeta($, 'meta[name="description"]')

    const coverImageUrl = extractMeta($, 'meta[property="og:image"]')

    const images = new Set<string>()
    extractImagesFromLdJson($).forEach((img) => images.add(img))
    if (coverImageUrl) images.add(coverImageUrl)
    extractImagesFromHtml(html).forEach((img) => images.add(img))

    const tags = extractTagsFromLdJson($)
    const metaKeywords = extractMeta($, 'meta[name="keywords"]')
    if (metaKeywords) {
      metaKeywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .forEach((keyword) => tags.push(keyword))
    }

    const detail: BehanceProjectDetail = {
      title,
      description,
      tags: Array.from(new Set(tags)).slice(0, 12),
      images: Array.from(images).slice(0, 24),
      coverImageUrl,
    }

    setDevCache(cacheKey, detail)
    return detail
  } catch (error) {
    console.error('Behance: failed to fetch project detail', error)
    return null
  }
}

export async function generateBehanceCacheFile(options: { profileUrl?: string; max?: number } = {}) {
  const profileUrl = normalizeProfileUrl(options.profileUrl ?? process.env.BEHANCE_PROFILE_URL ?? DEFAULT_PROFILE_URL)
  const projects = await getBehanceProjects({ profileUrl, max: options.max, forceRefresh: true })

  const payload: BehanceCacheFile = {
    generatedAt: new Date().toISOString(),
    profileUrl,
    projects,
  }

  await writeBehanceCacheFile(payload)
  return payload
}
