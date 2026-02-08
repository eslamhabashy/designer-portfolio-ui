import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, Briefcase, Eye, Heart } from 'lucide-react'

export default async function AdminDashboard() {
    const supabase = await createServerClient()

    // Fetch counts
    const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

    const { count: serviceCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })

    const stats = [
        {
            title: 'Projects',
            value: projectCount ?? 0,
            icon: FolderOpen,
            href: '/admin/projects',
            color: 'text-blue-500',
        },
        {
            title: 'Services',
            value: serviceCount ?? 0,
            icon: Briefcase,
            href: '/admin/services',
            color: 'text-green-500',
        },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-primary">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Manage your portfolio content.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link
                            href="/admin/projects?action=new"
                            className="block p-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                            + Add New Project
                        </Link>
                        <Link
                            href="/admin/services?action=new"
                            className="block p-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                            + Add New Service
                        </Link>
                        <Link
                            href="/"
                            target="_blank"
                            className="block p-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                            View Live Site →
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
