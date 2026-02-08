import fs from 'node:fs/promises'
import path from 'node:path'
import { getBehanceProjects, getBehanceProjectDetail } from '../lib/behance'
import type { BehanceCacheFile } from '../lib/behance-types'

const IMAGES_DIR = path.join(process.cwd(), 'public', 'projects')
const CACHE_PATH = path.join(process.cwd(), 'public', 'behance-cache.json')

const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
                Accept: 'image/*',
            },
        })

        if (!response.ok) {
            console.warn(`  ✗ Failed to download: ${response.status}`)
            return false
        }

        const buffer = await response.arrayBuffer()
        await fs.mkdir(path.dirname(destPath), { recursive: true })
        await fs.writeFile(destPath, Buffer.from(buffer))
        return true
    } catch (error) {
        console.warn(`  ✗ Error downloading:`, error)
        return false
    }
}

function getImageExtension(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|webp|gif)/i)
    return match ? match[1].toLowerCase() : 'jpg'
}

async function main() {
    console.log('='.repeat(60))
    console.log('Behance Image Downloader')
    console.log('='.repeat(60))
    console.log(`Output: ${IMAGES_DIR}`)
    console.log('')

    // Create images directory
    await fs.mkdir(IMAGES_DIR, { recursive: true })

    // Fetch all projects using existing working scraper
    console.log('Fetching projects from Behance...')
    const projects = await getBehanceProjects({ forceRefresh: true })
    console.log(`Found ${projects.length} projects\n`)

    if (projects.length === 0) {
        console.log('No projects found. Check the Behance scraper.')
        return
    }

    const updatedProjects = []

    for (let i = 0; i < projects.length; i++) {
        const project = projects[i]
        console.log(`\n[${i + 1}/${projects.length}] ${project.title}`)

        const projectDir = path.join(IMAGES_DIR, project.slug)
        await fs.mkdir(projectDir, { recursive: true })

        let localCoverPath: string | undefined
        const localGalleryPaths: string[] = []

        // Download cover image
        if (project.coverImageUrl) {
            const ext = getImageExtension(project.coverImageUrl)
            const coverFilename = `cover.${ext}`
            const coverPath = path.join(projectDir, coverFilename)

            console.log(`  Downloading cover...`)
            const success = await downloadImage(project.coverImageUrl, coverPath)
            if (success) {
                localCoverPath = `/projects/${project.slug}/${coverFilename}`
                console.log(`  ✓ Cover saved`)
            }
        }

        // Fetch project details to get gallery images
        console.log(`  Fetching gallery images...`)
        const details = await getBehanceProjectDetail(project.url, { forceRefresh: true })

        if (details && details.images.length > 0) {
            console.log(`  Found ${details.images.length} gallery images`)

            // Download gallery images (limit to 15 per project)
            const imagesToDownload = details.images.slice(0, 15)

            for (let j = 0; j < imagesToDownload.length; j++) {
                const imgUrl = imagesToDownload[j]
                const ext = getImageExtension(imgUrl)
                const imgFilename = `gallery-${String(j + 1).padStart(2, '0')}.${ext}`
                const imgPath = path.join(projectDir, imgFilename)

                const success = await downloadImage(imgUrl, imgPath)
                if (success) {
                    localGalleryPaths.push(`/projects/${project.slug}/${imgFilename}`)
                    process.stdout.write(`  ✓ Image ${j + 1}/${imagesToDownload.length}\r`)
                }

                // Rate limit
                await sleep(150)
            }
            console.log(`  ✓ Downloaded ${localGalleryPaths.length} gallery images`)
        } else {
            console.log(`  No gallery images found`)
        }

        // Save project metadata with local paths
        const projectMeta = {
            ...project,
            localCoverPath,
            localGalleryPaths,
        }
        await fs.writeFile(
            path.join(projectDir, 'meta.json'),
            JSON.stringify(projectMeta, null, 2)
        )

        updatedProjects.push({
            ...project,
            coverImageUrl: localCoverPath || project.coverImageUrl,
        })

        // Rate limit between projects
        await sleep(500)
    }

    // Save cache file with local image paths
    const cacheData: BehanceCacheFile = {
        generatedAt: new Date().toISOString(),
        profileUrl: process.env.BEHANCE_PROFILE_URL || 'https://www.behance.net/nadayasser28',
        projects: updatedProjects,
    }

    await fs.writeFile(CACHE_PATH, JSON.stringify(cacheData, null, 2))

    console.log('\n' + '='.repeat(60))
    console.log('Download complete!')
    console.log(`Projects: ${updatedProjects.length}`)
    console.log(`Cache: ${CACHE_PATH}`)
    console.log(`Images: ${IMAGES_DIR}`)
    console.log('')
    console.log('To use local images, set BEHANCE_STATIC_CACHE=1')
    console.log('='.repeat(60))
}

main().catch((error) => {
    console.error('Failed to download images:', error)
    process.exit(1)
})
