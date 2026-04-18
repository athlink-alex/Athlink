import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface PhotoUploadProps {
  onUploadComplete: (url: string) => void
  currentUrl?: string | null
  label?: string
}

export function PhotoUpload({ onUploadComplete, currentUrl, label = 'Photo' }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Create a preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      onUploadComplete(urlData.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        {/* Avatar preview */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F9FAFB] border-2 border-dashed border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
          {preview ? (
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : preview ? 'Change photo' : 'Upload photo'}
          </button>
          <p className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF. Max 5MB.</p>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  )
}