import { createServerClient, createStaticClient } from '@/lib/supabase/server'
import type { Project, ProjectImage } from '@/lib/supabase/types'
import type { BehanceProject } from '@/lib/behance-types'

export interface ProjectWithImages extends Project {
    gallery?: ProjectImage[]
}

/**
 * Convert Supabase Project to BehanceProject format for existing components
 */
export function projectToBehance(project: Project): BehanceProject {
    return {
        id: project.id,
        title: project.title,
        url: project.behance_url || `/work/${project.slug}`,
        slug: project.slug,
        coverImageUrl: project.cover_image_url,
        fields: project.fields || [],
        appreciations: project.appreciations,
        views: project.views,
    }
}

/**
 * Fetch all projects from Supabase (for public display)
 */
export async function getProjects(): Promise<Project[]> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data || []
}

/**
 * Fetch projects specifically marked for the hero section
 */
export async function getHeroProjects(): Promise<Project[]> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_hero', true)
        .order('display_order', { ascending: true })
        .limit(3)

    if (error) {
        console.error('Error fetching hero projects:', error)
        // Fallback to featured projects on error (e.g. column doesn't exist yet)
        return getFeaturedProjects()
    }

    // Fallback to featured projects if no hero projects are selected
    if (!data || data.length === 0) {
        return getFeaturedProjects()
    }

    return data
}

/**
 * Fetch featured projects from Supabase
 */
export async function getFeaturedProjects(): Promise<Project[]> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true })

    if (error) {
        console.error('Error fetching featured projects:', error)
        return []
    }

    return data || []
}

/**
 * Fetch a single project by slug, including gallery images
 */
export async function getProjectBySlug(slug: string): Promise<ProjectWithImages | null> {
    const supabase = await createServerClient()

    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !project) {
        console.error('Error fetching project:', error)
        return null
    }

    // Fetch gallery images
    const { data: gallery } = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', project.id)
        .order('display_order', { ascending: true })

    return {
        ...project,
        gallery: gallery || []
    }
}

/**
 * Get all project slugs (for static generation)
 * Uses createStaticClient because this runs at build time outside request context
 */
export async function getAllProjectSlugs(): Promise<string[]> {
    const supabase = createStaticClient()

    const { data, error } = await supabase
        .from('projects')
        .select('slug')

    if (error) {
        console.error('Error fetching slugs:', error)
        return []
    }

    return data?.map((p: { slug: string }) => p.slug) || []
}
