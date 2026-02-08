import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { ProjectsGrid } from '@/components/projects-grid'
import { getProjects, projectToBehance } from '@/lib/supabase/projects'

export const revalidate = 60 // Revalidate every minute for fresh data

export default async function WorkPage() {
  const dbProjects = await getProjects()
  const projects = dbProjects.map(projectToBehance)

  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <Hero
        subtitle="Portfolio"
        title="My Work"
        description="A collection of branding, packaging, and digital design projects spanning across various industries and clients."
      />

      {/* Projects Grid */}
      <section className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <ProjectsGrid projects={projects} />
        </div>
      </section>

      <Footer />
    </main>
  )
}
