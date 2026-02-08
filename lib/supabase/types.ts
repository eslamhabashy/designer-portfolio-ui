export interface Project {
    id: string
    title: string
    slug: string
    description?: string
    cover_image_url?: string
    behance_url?: string
    fields?: string[]
    appreciations?: number
    views?: number
    display_order: number
    is_featured: boolean
    is_hero: boolean
    created_at: string
    updated_at: string
}

export interface Service {
    id: string
    title: string
    description?: string
    price?: string
    display_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ProjectImage {
    id: string
    project_id: string
    image_url: string
    display_order: number
    created_at: string
}
