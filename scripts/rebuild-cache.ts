import fs from 'node:fs/promises'
import path from 'node:path'
import type { BehanceCacheFile, BehanceProject } from '../lib/behance-types'

const PROJECTS_DIR = path.join(process.cwd(), 'public', 'projects')
const CACHE_PATH = path.join(process.cwd(), 'public', 'behance-cache.json')

interface ProjectMeta {
    id?: string
    title: string
    url: string
    slug: string
    fields?: string[]
    appreciations?: number
    views?: number
    comments?: number
    localCoverPath?: string
    localGalleryPaths?: string[]
}

async function main() {
    console.log('Rebuilding behance-cache.json from meta.json files...\n')

    const projectDirs = await fs.readdir(PROJECTS_DIR)
    const projects: BehanceProject[] = []

    for (const dir of projectDirs) {
        const metaPath = path.join(PROJECTS_DIR, dir, 'meta.json')

        try {
            const metaContent = await fs.readFile(metaPath, 'utf-8')
            const meta: ProjectMeta = JSON.parse(metaContent)

            // Use first gallery image as cover if no dedicated cover
            let coverImageUrl = meta.localCoverPath
            if (!coverImageUrl && meta.localGalleryPaths && meta.localGalleryPaths.length > 0) {
                coverImageUrl = meta.localGalleryPaths[0]
            }

            // Clean up the title (remove "Link to project - " prefix)
            let title = meta.title
            if (title.startsWith('Link to project - ')) {
                title = title.replace('Link to project - ', '')
            }

            projects.push({
                id: meta.id,
                title,
                url: meta.url,
                slug: meta.slug,
                coverImageUrl,
                fields: meta.fields,
                appreciations: meta.appreciations,
                views: meta.views,
                comments: meta.comments,
            })

            console.log(`✓ ${dir}`)
        } catch (error) {
            console.warn(`✗ Skipping ${dir}: ${error}`)
        }
    }

    // Sort by project ID (newest first)
    projects.sort((a, b) => {
        const idA = parseInt(a.id || '0', 10)
        const idB = parseInt(b.id || '0', 10)
        return idB - idA
    })

    const cache: BehanceCacheFile = {
        generatedAt: new Date().toISOString(),
        profileUrl: process.env.BEHANCE_PROFILE_URL || 'https://www.behance.net/nadayasser28',
        projects,
    }

    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2))

    console.log(`\n✓ Saved ${projects.length} projects to ${CACHE_PATH}`)
}

main().catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
})
