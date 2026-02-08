import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use service role key to bypass RLS for admin operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface BehanceCacheProject {
    id: string
    title: string
    url: string
    slug: string
    coverImageUrl: string
    fields?: string[]
}

interface BehanceCache {
    generatedAt: string
    profileUrl: string
    projects: BehanceCacheProject[]
}

async function importProjects() {
    console.log('Reading behance-cache.json...')

    const cachePath = path.join(process.cwd(), 'public', 'behance-cache.json')

    if (!fs.existsSync(cachePath)) {
        console.error('behance-cache.json not found at:', cachePath)
        process.exit(1)
    }

    const cacheContent = fs.readFileSync(cachePath, 'utf-8')
    const cache: BehanceCache = JSON.parse(cacheContent)

    console.log(`Found ${cache.projects.length} projects to import`)

    // Prepare projects for insertion
    const projectsToInsert = cache.projects.map((project, index) => ({
        title: project.title,
        slug: project.slug,
        cover_image_url: project.coverImageUrl,
        behance_url: project.url,
        fields: project.fields || [],
        display_order: index,
        is_featured: index < 3, // First 3 projects are featured
        appreciations: 0,
        views: 0,
    }))

    console.log('Inserting projects into Supabase...')

    // Insert in batches to avoid conflicts
    for (const project of projectsToInsert) {
        const { error } = await supabase
            .from('projects')
            .upsert(project, { onConflict: 'slug' })

        if (error) {
            console.error(`Error inserting "${project.title}":`, error.message)
        } else {
            console.log(`✓ Imported: ${project.title}`)
        }
    }

    console.log('\n✅ Import complete!')

    // Verify
    const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('display_order')

    if (error) {
        console.error('Error verifying:', error.message)
    } else {
        console.log(`\nTotal projects in database: ${data?.length || 0}`)
    }
}

importProjects().catch(console.error)
