import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowLeft, Heart, Eye, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCount } from '@/lib/format'
import type { BehanceProject, BehanceProjectDetail } from '@/lib/behance-types'

interface ProjectDetailProps {
  project: BehanceProject
  details: BehanceProjectDetail | null
  allProjects: BehanceProject[]
}

export function ProjectDetail({ project, details, allProjects }: ProjectDetailProps) {
  const currentIndex = allProjects.findIndex((p) => p.slug === project.slug)
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length]
  const prevProject = allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length]

  const images = details?.images?.length
    ? details.images
    : project.coverImageUrl
      ? [project.coverImageUrl]
      : []

  const galleryImages = images.length > 1 ? images.slice(1) : []
  const tags = details?.tags?.length ? details.tags : project.fields ?? []

  return (
    <>
      {/* Hero Section with Cover */}
      <section className="relative w-full h-96 md:h-[600px] overflow-hidden bg-secondary">
        <Image
          src={project.coverImageUrl || images[0] || '/placeholder.svg'}
          alt={project.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </section>

      {/* Project Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {tags.slice(0, 1).map((tag) => (
                <Badge key={tag} className="bg-accent/20 text-accent hover:bg-accent/30">
                  {tag}
                </Badge>
              ))}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {project.appreciations !== undefined && (
                  <span className="inline-flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    {formatCount(project.appreciations)} appreciations
                  </span>
                )}
                {project.views !== undefined && (
                  <span className="inline-flex items-center gap-2">
                    <Eye className="w-4 h-4 text-accent" />
                    {formatCount(project.views)} views
                  </span>
                )}
                {project.comments !== undefined && (
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-accent" />
                    {formatCount(project.comments)} comments
                  </span>
                )}
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6">
              {details?.title || project.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {details?.description || 'Explore the full project presentation on Behance for more context and visuals.'}
            </p>
            <div className="mt-6">
              <Link
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 group">
                  View on Behance
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Grid: Overview and Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 pb-20 border-b border-border">
            {/* Overview */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-serif font-bold text-primary mb-4">Overview</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {details?.description || 'This project is presented on Behance with full-resolution visuals. Visit the Behance page to explore the entire case study.'}
              </p>
            </div>

            {/* Details Sidebar */}
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                  Tags
                </h3>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No tags available.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                  Project Link
                </h3>
                <Link
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-2"
                >
                  View on Behance
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <div className="mb-20">
              <h2 className="text-2xl font-serif font-bold text-primary mb-8">Gallery</h2>
              <div className="space-y-8">
                {galleryImages.map((image, idx) => (
                  <div key={idx} className="relative aspect-video overflow-hidden rounded-2xl bg-secondary shadow-soft-lg">
                    <Image
                      src={image || '/placeholder.svg'}
                      alt={`${project.title} gallery image ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* More Projects */}
          {allProjects.length > 1 && (
            <div className="pt-20 border-t border-border">
              <h2 className="text-2xl font-serif font-bold text-primary mb-8">More Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Previous */}
                <Link href={`/work/${prevProject.slug}`} className="group">
                  <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary shadow-soft hover:shadow-soft-lg transition-all">
                      <Image
                        src={prevProject.coverImageUrl || '/placeholder.svg'}
                        alt={prevProject.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Previous Project</p>
                      <h3 className="text-lg font-serif font-bold text-primary group-hover:text-accent transition-colors">
                        {prevProject.title}
                      </h3>
                    </div>
                  </div>
                </Link>

                {/* Next */}
                <Link href={`/work/${nextProject.slug}`} className="group">
                  <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary shadow-soft hover:shadow-soft-lg transition-all">
                      <Image
                        src={nextProject.coverImageUrl || '/placeholder.svg'}
                        alt={nextProject.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Next Project</p>
                      <h3 className="text-lg font-serif font-bold text-primary group-hover:text-accent transition-colors">
                        {nextProject.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Back Link */}
          <div className="mt-20">
            <Link href="/work" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
