'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { GalleryUpload } from '@/components/admin/gallery-upload'
import type { Project } from '@/lib/supabase/types'

function slugify(text: string) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        cover_image_url: '',
        behance_url: '',
        fields: '',
        is_featured: false,
        is_hero: false,
    })
    const supabase = createClient()

    useEffect(() => {
        fetchProjects()
    }, [])

    async function fetchProjects() {
        setLoading(true)
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('display_order', { ascending: true })

        if (!error && data) {
            setProjects(data)
        }
        setLoading(false)
    }

    function openDialog(project?: Project) {
        if (project) {
            setEditingProject(project)
            setFormData({
                title: project.title,
                slug: project.slug,
                description: project.description || '',
                cover_image_url: project.cover_image_url || '',
                behance_url: project.behance_url || '',
                fields: project.fields?.join(', ') || '',
                is_featured: project.is_featured,
                is_hero: project.is_hero || false,
            })
        } else {
            setEditingProject(null)
            setFormData({
                title: '',
                slug: '',
                description: '',
                cover_image_url: '',
                behance_url: '',
                fields: '',
                is_featured: false,
                is_hero: false,
            })
        }
        setDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const projectData = {
            title: formData.title,
            slug: formData.slug || slugify(formData.title),
            description: formData.description || null,
            cover_image_url: formData.cover_image_url || null,
            behance_url: formData.behance_url || null,
            fields: formData.fields ? formData.fields.split(',').map(f => f.trim()) : [],
            is_featured: formData.is_featured,
            is_hero: formData.is_hero,
            display_order: editingProject?.display_order ?? projects.length,
        }

        if (editingProject) {
            await supabase
                .from('projects')
                .update(projectData)
                .eq('id', editingProject.id)
        } else {
            await supabase.from('projects').insert(projectData)
        }

        setDialogOpen(false)
        fetchProjects()
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this project?')) return

        await supabase.from('projects').delete().eq('id', id)
        fetchProjects()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary">Projects</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your portfolio projects
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()} className="bg-accent hover:bg-accent/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProject ? 'Edit Project' : 'Add New Project'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="auto-generated from title"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                <ImageUpload
                                    value={formData.cover_image_url}
                                    onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="behance_url">Behance URL</Label>
                                <Input
                                    id="behance_url"
                                    value={formData.behance_url}
                                    onChange={(e) => setFormData({ ...formData, behance_url: e.target.value })}
                                    placeholder="https://behance.net/gallery/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fields">Tags (comma separated)</Label>
                                <Input
                                    id="fields"
                                    value={formData.fields}
                                    onChange={(e) => setFormData({ ...formData, fields: e.target.value })}
                                    placeholder="Branding, Packaging, UI Design"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_featured"
                                    checked={formData.is_featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                                />
                                <Label htmlFor="is_featured">Featured Project</Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_hero"
                                    checked={formData.is_hero}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_hero: checked })}
                                />
                                <Label htmlFor="is_hero">Show in Hero Section</Label>
                            </div>

                            {/* Gallery Images - only show when editing existing project */}
                            {editingProject && (
                                <div className="space-y-2 pt-4 border-t">
                                    <Label>Gallery Images</Label>
                                    <GalleryUpload projectId={editingProject.id} />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-accent hover:bg-accent/90">
                                    {editingProject ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {
                loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No projects yet. Add your first project to get started.
                    </div>
                ) : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Featured</TableHead>
                                    <TableHead>Hero</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>
                                            {project.cover_image_url ? (
                                                <div className="relative w-12 h-12 rounded overflow-hidden bg-secondary">
                                                    <Image
                                                        src={project.cover_image_url}
                                                        alt={project.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                                                    <span className="text-xs text-muted-foreground">No img</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{project.title}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {project.fields?.slice(0, 2).join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            {project.is_featured ? (
                                                <span className="text-accent">★ Featured</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {project.is_hero ? (
                                                <span className="text-blue-500">⚡ Hero</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {project.behance_url && (
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={project.behance_url} target="_blank" rel="noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => openDialog(project)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleDelete(project.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )
            }
        </div>
    )
}
