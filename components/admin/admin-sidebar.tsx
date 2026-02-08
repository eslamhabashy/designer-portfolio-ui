'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Settings, LogOut, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/projects', label: 'Projects', icon: FolderOpen },
    { href: '/admin/services', label: 'Services', icon: Briefcase },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/admin/login')
        router.refresh()
    }

    return (
        <aside className="w-64 bg-primary text-primary-foreground min-h-screen flex flex-col">
            <div className="p-6 border-b border-primary-foreground/10">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
                        N
                    </div>
                    <span className="font-serif font-bold text-lg">Admin</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-primary-foreground/10'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-primary-foreground/10">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </Button>
            </div>
        </aside>
    )
}
