import { notFound } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProjectDetail } from '@/components/project-detail'
import { getProjectBySlug, getAllProjectSlugs, projectToBehance, getProjects } from '@/lib/supabase/projects'
import type { BehanceProjectDetail } from '@/lib/behance-types'

export const revalidate = 60 // Revalidate every minute

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const projectData = await getProjectBySlug(slug)

  if (!projectData) {
    notFound()
  }

  const project = projectToBehance(projectData)

  // Get all projects for navigation
  const allDbProjects = await getProjects()
  const allProjects = allDbProjects.map(projectToBehance)

  // Build detail object from Supabase data
  const details: BehanceProjectDetail = {
    title: projectData.title,
    description: projectData.description,
    tags: projectData.fields,
    images: projectData.gallery?.map(img => img.image_url) || [],
    coverImageUrl: projectData.cover_image_url,
    localImages: projectData.gallery?.map(img => img.image_url) || [],
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      <ProjectDetail project={project} details={details} allProjects={allProjects} />
      <Footer />
    </main>
  )
}
