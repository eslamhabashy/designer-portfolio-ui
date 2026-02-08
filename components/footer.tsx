import Link from 'next/link'
import { Mail, Linkedin, Instagram, Github, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: Mail, label: 'Email', href: 'mailto:nada@example.com' },
    { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
    { icon: Github, label: 'GitHub', href: 'https://github.com' },
  ]

  const footerLinks = [
    { label: 'Work', href: '/work' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '#' },
  ]

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* CTA Section */}
        <div className="mb-16 pb-16 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-md">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-4">
                Let's create something beautiful
              </h3>
              <p className="text-muted-foreground">
                Got a project in mind? Let's collaborate to bring your vision to life.
              </p>
            </div>
            <Link href="/contact" className="flex-shrink-0">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 group">
                Start a Project
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Links & Social */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-primary mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-primary mb-4">Info</h4>
            <ul className="space-y-3">
              <li className="text-muted-foreground text-sm">
                Branding &amp; Packaging Designer
              </li>
              <li className="text-muted-foreground text-sm">
                Based in Egypt
              </li>
              <li className="text-muted-foreground text-sm">
                Available for freelance &amp; full-time
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-primary mb-4">Connect</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-secondary hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center text-muted-foreground hover:text-accent-foreground"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Nada Yasser. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
