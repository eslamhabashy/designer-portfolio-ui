import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function importGalleryImages() {
    console.log('Fetching projects from Supabase...')

    // Get all projects
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, slug')

    if (projectsError || !projects) {
        console.error('Error fetching projects:', projectsError?.message)
        process.exit(1)
    }

    console.log(`Found ${projects.length} projects`)

    const publicDir = path.join(process.cwd(), 'public', 'projects')
    let totalImported = 0

    for (const project of projects) {
        const projectDir = path.join(publicDir, project.slug)

        if (!fs.existsSync(projectDir)) {
            console.log(`⚠ No folder found for: ${project.slug}`)
            continue
        }

        // Get all gallery images (skip meta.json)
        const files = fs.readdirSync(projectDir)
            .filter(f => f.startsWith('gallery-') && !f.endsWith('.json'))
            .sort((a, b) => {
                // Sort by number: gallery-01, gallery-02, etc.
                const numA = parseInt(a.match(/gallery-(\d+)/)?.[1] || '0')
                const numB = parseInt(b.match(/gallery-(\d+)/)?.[1] || '0')
                return numA - numB
            })

        if (files.length === 0) {
            console.log(`⚠ No gallery images in: ${project.slug}`)
            continue
        }

        console.log(`\nImporting ${files.length} images for: ${project.slug}`)

        // Check if images already exist for this project
        const { data: existingImages } = await supabase
            .from('project_images')
            .select('image_url')
            .eq('project_id', project.id)

        const existingUrls = new Set(existingImages?.map(img => img.image_url) || [])

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const imageUrl = `/projects/${project.slug}/${file}`

            // Skip if already exists
            if (existingUrls.has(imageUrl)) {
                console.log(`  ⏭ Already exists: ${file}`)
                continue
            }

            const { error: insertError } = await supabase
                .from('project_images')
                .insert({
                    project_id: project.id,
                    image_url: imageUrl,
                    display_order: i
                })

            if (insertError) {
                console.error(`  ✗ Failed: ${file} - ${insertError.message}`)
            } else {
                console.log(`  ✓ Imported: ${file}`)
                totalImported++
            }
        }
    }

    console.log(`\n✅ Import complete! Added ${totalImported} gallery images.`)

    // Summary
    const { data: allImages } = await supabase
        .from('project_images')
        .select('id')

    console.log(`Total gallery images in database: ${allImages?.length || 0}`)
}

importGalleryImages().catch(console.error)
