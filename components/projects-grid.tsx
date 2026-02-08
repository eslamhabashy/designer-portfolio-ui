'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { formatCount } from '@/lib/format'
import { Heart, Eye } from 'lucide-react'
import type { BehanceProject } from '@/lib/behance-types'

interface ProjectsGridProps {
  projects: BehanceProject[]
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    'All',
    ...new Set(projects.flatMap((project) => project.fields ?? []).filter(Boolean)),
  ]

  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      !selectedCategory || selectedCategory === 'All' || project.fields?.includes(selectedCategory)

    const tags = project.fields ?? []
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  return (
    <section className="py-16">
      <div className="space-y-8">
        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-secondary border-border focus:border-accent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === 'All' ? null : category)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
                  (category === 'All' && !selectedCategory) || selectedCategory === category
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-secondary text-primary border-border hover:border-accent'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </p>

        {/* Grid */}
        {filteredProjects.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {filteredProjects.map((project) => (
              <motion.div key={project.slug} variants={fadeInUp}>
                <Link href={`/work/${project.slug}`} className="group">
                  <div className="space-y-4 h-full">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary shadow-soft hover:shadow-soft-lg transition-all">
                      <Image
                        src={project.coverImageUrl || '/placeholder.svg'}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-serif font-bold text-primary group-hover:text-accent transition-colors">
                          {project.title}
                        </h3>
                      </div>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        View the full project details and image gallery on Behance.
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {(project.fields ?? []).slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(project.fields?.length ?? 0) > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{(project.fields?.length ?? 0) - 2}
                          </span>
                        )}
                      </div>

                      {(project.appreciations !== undefined || project.views !== undefined) && (
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No projects found. Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
