'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroProps {
  title: string
  subtitle: string
  description: string
  images?: string[]
  primaryCta?: {
    label: string
    href: string
  }
  secondaryCta?: {
    label: string
    href: string
  }
}

// Card rotation angles for the stack effect
const CARD_ROTATIONS = [-8, 3, -4, 6]
const CARD_OFFSETS = [
  { x: -20, y: 10 },
  { x: 15, y: -15 },
  { x: -10, y: 20 },
  { x: 25, y: 5 },
]

export function Hero({
  title,
  subtitle,
  description,
  images = [],
  primaryCta,
  secondaryCta,
}: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const textRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLSpanElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const cardStackRef = useRef<HTMLDivElement>(null)

  // Filter to get valid images (max 4)
  const displayImages = images.filter(Boolean).slice(0, 4)

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Create timeline for entrance animation
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Animate cards with stagger
      if (cardsRef.current.length > 0) {
        const validCards = cardsRef.current.filter(Boolean)

        // Set initial state
        gsap.set(validCards, {
          opacity: 0,
          y: 100,
          scale: 0.8,
          rotation: 0,
        })

        // Animate cards in with stagger
        tl.to(validCards, {
          opacity: 1,
          visibility: 'visible',
          y: 0,
          scale: 1,
          rotation: (i) => CARD_ROTATIONS[i] || 0,
          duration: 1.2,
          stagger: 0.15,
          ease: 'power3.out',
        })

        // --- NEW: ScrollTrigger for "vanishing" effect ---
        gsap.fromTo(validCards,
          {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotation: (i) => CARD_ROTATIONS[i] || 0,
          },
          {
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
              immediateRender: false,
            },
            x: (i) => {
              // 3-way separation: left, up, right
              if (validCards.length === 3) {
                if (i === 0) return -600 // Back card left
                if (i === 1) return 0    // Middle card up
                if (i === 2) return 600  // Front card right
              }
              const dir = i % 2 === 0 ? -1 : 1
              return dir * 600
            },
            y: (i) => {
              // Middle one goes up fast, others go up slow
              if (validCards.length === 3 && i === 1) return -400
              return -200
            },
            rotation: (i) => {
              if (validCards.length === 3) {
                if (i === 0) return -60
                if (i === 1) return 0
                if (i === 2) return 60
              }
              const dir = i % 2 === 0 ? -1 : 1
              return dir * 45
            },
            opacity: 0,
            scale: 0.3,
            stagger: 0.05
          }
        )
      }

      // Animate text elements
      const textElements = [subtitleRef.current, titleRef.current, descRef.current, ctaRef.current].filter(Boolean)

      gsap.set(textElements, {
        opacity: 0,
        y: 40,
      })

      tl.to(textElements, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
      }, "-=0.2")

    }, containerRef)

    return () => ctx.revert()
  }, [displayImages.length])

  // Mouse tracking for parallax effect
  useEffect(() => {
    if (!containerRef.current || displayImages.length === 0) return

    const container = containerRef.current
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[]

    if (cards.length === 0) return

    // Create quickTo functions for smooth animation
    const xTos = cards.map(card => gsap.quickTo(card, 'x', { duration: 0.5, ease: 'power2.out' }))
    const yTos = cards.map(card => gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power2.out' }))
    const rotationTos = cards.map((card, i) =>
      gsap.quickTo(card, 'rotation', { duration: 0.5, ease: 'power2.out' })
    )

    const handleMouseMove = (e: MouseEvent) => {
      // Skip mouse parallax if we've scrolled past a certain point to avoid conflict with ScrollTrigger
      if (window.scrollY > 100) return

      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = (e.clientX - centerX) / rect.width
      const deltaY = (e.clientY - centerY) / rect.height

      cards.forEach((_, i) => {
        const multiplier = (i + 1) * 8  // Different movement per card
        const baseOffset = CARD_OFFSETS[i] || { x: 0, y: 0 }

        xTos[i](baseOffset.x + deltaX * multiplier)
        yTos[i](baseOffset.y + deltaY * multiplier)
        rotationTos[i](CARD_ROTATIONS[i] + deltaX * 3)
      })
    }

    const handleMouseLeave = () => {
      cards.forEach((_, i) => {
        const baseOffset = CARD_OFFSETS[i] || { x: 0, y: 0 }
        xTos[i](baseOffset.x)
        yTos[i](baseOffset.y)
        rotationTos[i](CARD_ROTATIONS[i] || 0)
      })
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [displayImages.length])

  return (
    <section
      ref={containerRef}
      className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-0 w-full flex-grow flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Text Content */}
          <div ref={textRef} className="text-center lg:text-left order-2 lg:order-1">
            {/* Subtitle */}
            <span
              ref={subtitleRef}
              className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-6"
            >
              {subtitle}
            </span>

            {/* Title */}
            <h1
              ref={titleRef}
              className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-primary mb-6 leading-tight"
            >
              {title}
            </h1>

            {/* Description */}
            <p
              ref={descRef}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              {description}
            </p>

            {/* CTA Buttons */}
            {(primaryCta || secondaryCta) && (
              <div
                ref={ctaRef}
                className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
              >
                {primaryCta && (
                  <Link href={primaryCta.href}>
                    <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 group">
                      {primaryCta.label}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
                {secondaryCta && (
                  <Link href={secondaryCta.href}>
                    <Button size="lg" variant="outline" className="border-border hover:bg-secondary bg-transparent">
                      {secondaryCta.label}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Card Stack */}
          {displayImages.length > 0 && (
            <div className="relative order-1 lg:order-2 h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] flex items-center justify-center">
              <div className="relative w-[280px] md:w-[350px] lg:w-[420px] xl:w-[500px] h-[350px] md:h-[450px] lg:h-[540px] xl:h-[640px]">
                {displayImages.map((image, index) => (
                  <div
                    key={index}
                    ref={(el) => { cardsRef.current[index] = el }}
                    className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-pointer transition-shadow hover:shadow-accent/20"
                    style={{
                      zIndex: displayImages.length - index,
                      transformOrigin: 'center center',
                    }}
                  >
                    <Image
                      src={image}
                      alt={`Featured project ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
