import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Service {
  title: string
  description: string
  price: string
}

interface ServicesSectionProps {
  services: Service[]
}

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Services</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mt-2">
            What I Offer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
            Comprehensive design solutions tailored to your brand needs
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="bg-background rounded-2xl p-8 border border-border hover:shadow-soft-lg hover:border-accent/50 transition-all"
            >
              <h3 className="text-xl font-semibold text-primary mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {service.description}
              </p>
              <p className="text-accent font-semibold">
                {service.price}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-6">
            Looking for something custom? Let's discuss your project.
          </p>
          <Link href="/contact">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 group">
              Get in Touch
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
