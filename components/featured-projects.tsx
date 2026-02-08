'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronLeft, ChevronRight, ArrowRight, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCount } from '@/lib/format'
import type { BehanceProject } from '@/lib/behance-types'

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface FeaturedProjectsProps {
  projects: BehanceProject[]
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const featuredProjects = projects

  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const textItemsRef = useRef<(HTMLDivElement | HTMLHeadingElement | HTMLParagraphElement | null)[]>([])

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // 1. Header Animation
      gsap.from(headerRef.current, {
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
      })

      // 2. Image Animation (Left)
      gsap.from(imageRef.current, {
        scrollTrigger: {
          trigger: imageRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        scale: 0.9,
        x: -30,
        duration: 1,
        ease: 'power3.out',
      })

      // 3. Content Animation (Right) with Staggered children
      const validTextItems = textItemsRef.current.filter(Boolean)

      gsap.from(validTextItems, {
        scrollTrigger: {
          trigger: contentRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // Transition animation when project changes
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in the new content
      gsap.fromTo([imageRef.current, contentRef.current],
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? featuredProjects.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === featuredProjects.length - 1 ? 0 : prev + 1))
  }

  if (featuredProjects.length === 0) return null

  const current = featuredProjects[currentIndex]
  const primaryTag = current.fields?.[0] || 'Project'
  const hasStats = current.appreciations !== undefined || current.views !== undefined

  return (
    <section ref={sectionRef} className="py-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Featured Work</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mt-2">
              Latest Projects
            </h2>
          </div>
          <Link href="/work">
            <Button variant="outline" className="border-border hover:bg-secondary gap-2 group bg-transparent">
              View All Projects
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Project Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image Column */}
          <div
            ref={imageRef}
            className="relative aspect-square overflow-hidden rounded-2xl bg-secondary shadow-soft-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
            <Image
              src={current.coverImageUrl || '/placeholder.svg'}
              alt={current.title}
              fill
              className="object-cover"
              key={current.slug}
              priority
            />
          </div>

          {/* Text Content Column */}
          <div ref={contentRef} className="flex flex-col justify-center">
            <div className="mb-4" ref={(el) => { textItemsRef.current[0] = el }}>
              <Badge className="bg-accent/20 text-accent hover:bg-accent/30">
                {primaryTag}
              </Badge>
            </div>

            <h3
              className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4"
              ref={(el) => { textItemsRef.current[1] = el }}
            >
              {current.title}
            </h3>

            <p
              className="text-lg text-muted-foreground mb-6 leading-relaxed"
              ref={(el) => { textItemsRef.current[2] = el }}
            >
              Explore the full project on Behance with detailed visuals and creative context.
            </p>

            {hasStats && (
              <div
                className="mb-8 flex flex-wrap gap-4 text-sm text-muted-foreground"
                ref={(el) => { textItemsRef.current[3] = el }}
              >
                {current.appreciations !== undefined && (
                  <span className="inline-flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    {formatCount(current.appreciations)} appreciations
                  </span>
                )}
                {current.views !== undefined && (
                  <span className="inline-flex items-center gap-2">
                    <Eye className="w-4 h-4 text-accent" />
                    {formatCount(current.views)} views
                  </span>
                )}
              </div>
            )}

            {/* Navigation & CTA */}
            <div className="flex items-center gap-4" ref={(el) => { textItemsRef.current[4] = el }}>
              <Link href={`/work/${current.slug}`}>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 group">
                  View Project
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              {/* Carousel Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevious}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors border border-border"
                  aria-label="Previous project"
                >
                  <ChevronLeft className="w-5 h-5 text-primary" />
                </button>
                <span className="text-sm text-muted-foreground font-medium px-2">
                  {String(currentIndex + 1).padStart(2, '0')} / {String(featuredProjects.length).padStart(2, '0')}
                </span>
                <button
                  onClick={goToNext}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors border border-border"
                  aria-label="Next project"
                >
                  <ChevronRight className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
