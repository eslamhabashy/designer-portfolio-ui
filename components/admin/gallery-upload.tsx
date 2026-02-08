'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, GripVertical } from 'lucide-react'
import Image from 'next/image'
import type { ProjectImage } from '@/lib/supabase/types'

interface GalleryUploadProps {
    projectId: string
    bucketName?: string
}

export function GalleryUpload({
    projectId,
    bucketName = 'project-images'
}: GalleryUploadProps) {
    const [images, setImages] = useState<ProjectImage[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    // Fetch existing gallery images
    useEffect(() => {
        async function fetchImages() {
            const { data, error } = await supabase
                .from('project_images')
                .select('*')
                .eq('project_id', projectId)
                .order('display_order', { ascending: true })

            if (!error && data) {
                setImages(data)
            }
            setLoading(false)
        }
        fetchImages()
    }, [projectId, supabase])

    const uploadFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB')
            return
        }

        setError(null)
        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `gallery/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            // Insert into project_images table
            const { data: newImage, error: insertError } = await supabase
                .from('project_images')
                .insert({
                    project_id: projectId,
                    image_url: publicUrl,
                    display_order: images.length
                })
                .select()
                .single()

            if (insertError) throw insertError

            setImages([...images, newImage])
        } catch (err) {
            console.error('Upload error:', err)
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
        }
    }, [supabase, bucketName, projectId, images])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const files = Array.from(e.dataTransfer.files)
        files.forEach(file => uploadFile(file))
    }, [uploadFile])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        files.forEach(file => uploadFile(file))
    }

    const handleDelete = async (image: ProjectImage) => {
        try {
            // Delete from database
            await supabase
                .from('project_images')
                .delete()
                .eq('id', image.id)

            // Only try to delete from storage if it's a Supabase storage URL
            if (image.image_url.includes('supabase.co/storage')) {
                try {
                    const url = new URL(image.image_url)
                    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
                    if (pathMatch) {
                        await supabase.storage.from(bucketName).remove([pathMatch[1]])
                    }
                } catch {
                    // Ignore storage delete errors for non-storage URLs
                }
            }

            setImages(images.filter(img => img.id !== image.id))
        } catch (err) {
            console.error('Delete error:', err)
            setError('Failed to delete image')
        }
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading gallery...</div>
    }

    return (
        <div className="space-y-4">
            {/* Existing images grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className="relative aspect-square rounded-lg overflow-hidden bg-secondary group"
                        >
                            <Image
                                src={image.image_url}
                                alt={`Gallery image ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDelete(image)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                                {index + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload zone */}
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-6
                    flex flex-col items-center justify-center gap-2
                    transition-colors cursor-pointer
                    ${dragOver
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }
                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                `}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('gallery-upload')?.click()}
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                    </>
                ) : (
                    <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <p className="text-sm text-center">
                            Drop images here or click to add
                        </p>
                    </>
                )}
                <input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            <p className="text-xs text-muted-foreground">
                {images.length} image{images.length !== 1 ? 's' : ''} in gallery
            </p>
        </div>
    )
}
