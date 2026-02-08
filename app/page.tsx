import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { FeaturedProjects } from '@/components/featured-projects'
import { ServicesSection } from '@/components/services-section'
import { ToolsSection } from '@/components/tools-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { getHeroProjects, getFeaturedProjects, projectToBehance } from '@/lib/supabase/projects'
import { services, tools, testimonials, aboutContent } from '@/lib/data'

export const revalidate = 60 // Revalidate every minute for fresh data

export default async function Home() {
  const heroDbProjects = await getHeroProjects()
  const heroProjects = heroDbProjects.map(projectToBehance)

  const featuredDbProjects = await getFeaturedProjects()
  const featuredProjects = featuredDbProjects.map(projectToBehance)

  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <Hero
        subtitle="Welcome"
        title="I'm Nada Yasser"
        description={aboutContent.shortBio}
        images={heroProjects.map(p => p.coverImageUrl).filter((url): url is string => Boolean(url))}
        primaryCta={{ label: 'View My Work', href: '/work' }}
        secondaryCta={{ label: 'Get In Touch', href: '/contact' }}
      />

      {/* Featured Projects */}
      <FeaturedProjects projects={featuredProjects} />

      {/* Services */}
      <ServicesSection services={services} />

      {/* Tools */}
      <ToolsSection tools={tools} />

      {/* Testimonials */}
      <TestimonialsSection testimonials={testimonials} />

      <Footer />
    </main>
  )
}
