import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { aboutContent } from '@/lib/data'

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <Hero
        subtitle="About Me"
        title="Design with Purpose"
        description="Creating meaningful visual identities that tell your brand's story."
      />

      {/* Content */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bio */}
          <div className="mb-20">
            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
              {aboutContent.bio}
            </p>
            <p className="text-xl text-muted-foreground leading-relaxed">
              I believe that great design is not just about aesthetics—it's about creating meaningful
              experiences that resonate with people. Whether it's a logo, packaging, or complete brand
              identity, I approach every project with intentionality and attention to detail.
            </p>
          </div>

          {/* Skills Grid */}
          <div className="mb-20 pb-20 border-b border-border">
            <h2 className="text-3xl font-serif font-bold text-primary mb-8">Skills</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {aboutContent.skills.map((skill) => (
                <div
                  key={skill}
                  className="bg-secondary rounded-lg p-4 border border-transparent hover:border-accent/50 transition-colors"
                >
                  <p className="font-medium text-primary">{skill}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Process */}
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary mb-12">My Process</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aboutContent.processSteps.map((step) => (
                <div key={step.number} className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-5xl font-serif font-bold text-accent/30">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-primary">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
