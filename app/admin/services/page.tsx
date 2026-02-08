'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import type { Service } from '@/lib/supabase/types'

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        is_active: true,
    })
    const supabase = createClient()

    useEffect(() => {
        fetchServices()
    }, [])

    async function fetchServices() {
        setLoading(true)
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('display_order', { ascending: true })

        if (!error && data) {
            setServices(data)
        }
        setLoading(false)
    }

    function openDialog(service?: Service) {
        if (service) {
            setEditingService(service)
            setFormData({
                title: service.title,
                description: service.description || '',
                price: service.price || '',
                is_active: service.is_active,
            })
        } else {
            setEditingService(null)
            setFormData({
                title: '',
                description: '',
                price: '',
                is_active: true,
            })
        }
        setDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const serviceData = {
            title: formData.title,
            description: formData.description || null,
            price: formData.price || null,
            is_active: formData.is_active,
            display_order: editingService?.display_order ?? services.length,
        }

        if (editingService) {
            await supabase
                .from('services')
                .update(serviceData)
                .eq('id', editingService.id)
        } else {
            await supabase.from('services').insert(serviceData)
        }

        setDialogOpen(false)
        fetchServices()
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this service?')) return

        await supabase.from('services').delete().eq('id', id)
        fetchServices()
    }

    async function toggleActive(service: Service) {
        await supabase
            .from('services')
            .update({ is_active: !service.is_active })
            .eq('id', service.id)
        fetchServices()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary">Services</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your offered services and pricing
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => openDialog()} className="bg-accent hover:bg-accent/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Service
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingService ? 'Edit Service' : 'Add New Service'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Branding & Identity"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What's included in this service..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="e.g., Starting at $2,500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active">Active (visible on website)</Label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-accent hover:bg-accent/90">
                                    {editingService ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : services.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No services yet. Add your first service to get started.
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{service.title}</div>
                                            {service.description && (
                                                <div className="text-sm text-muted-foreground line-clamp-1">
                                                    {service.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {service.price || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => toggleActive(service)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${service.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {service.is_active ? 'Active' : 'Hidden'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(service)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(service.id)}
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
            )}
        </div>
    )
}
