'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    bucketName?: string
    folder?: string
}

export function ImageUpload({
    value,
    onChange,
    bucketName = 'project-images',
    folder = 'covers'
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const uploadFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB')
            return
        }

        setError(null)
        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            onChange(publicUrl)
        } catch (err) {
            console.error('Upload error:', err)
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
        }
    }, [supabase, bucketName, folder, onChange])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) uploadFile(file)
    }, [uploadFile])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
    }

    const handleRemove = () => {
        onChange('')
    }

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                    <Image
                        src={value}
                        alt="Uploaded image"
                        fill
                        className="object-cover"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div
                    className={`
                        relative border-2 border-dashed rounded-lg p-8
                        flex flex-col items-center justify-center gap-3
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
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="p-3 rounded-full bg-secondary">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">
                                    Drop an image here or click to upload
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, GIF up to 5MB
                                </p>
                            </div>
                        </>
                    )}
                    <Input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </div>
            )}

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Fallback URL input */}
            <div className="flex items-center gap-2 pt-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Or paste image URL..."
                    value={value?.startsWith('http') ? '' : value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="text-sm"
                />
            </div>
        </div>
    )
}
