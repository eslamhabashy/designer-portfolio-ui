interface ToolsSectionProps {
  tools: string[]
}

export function ToolsSection({ tools }: ToolsSectionProps) {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Tools & Software</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mt-2">
            Technologies I Use
          </h2>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <div
              key={tool}
              className="bg-secondary rounded-2xl p-6 text-center border border-transparent hover:border-accent/50 hover:shadow-soft transition-all"
            >
              <p className="font-medium text-primary">{tool}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
