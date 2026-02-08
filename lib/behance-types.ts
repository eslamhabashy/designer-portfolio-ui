export interface BehanceProject {
  id?: string
  title: string
  url: string
  slug: string
  coverImageUrl?: string
  appreciations?: number
  views?: number
  comments?: number
  fields?: string[]
}

export interface BehanceProjectDetail {
  title: string
  description?: string
  tags?: string[]
  images: string[]
  coverImageUrl?: string
  localImages?: string[]
}

export interface BehanceCacheFile {
  generatedAt: string
  profileUrl: string
  projects: BehanceProject[]
}
