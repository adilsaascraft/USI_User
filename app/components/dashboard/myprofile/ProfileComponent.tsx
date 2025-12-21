'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { useUser } from '@/app/context/UserContext'
import type { ProfileData } from '@/app/types/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'

const fetcher = async (url: string) => {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

const mapApiToForm = (user: any): ProfileData => ({
  prefix: user.prefix || '',
  fullName: user.name || '',
  qualification: user.qualification || '',
  affiliationHospital: user.affiliation || '',
  mobile: user.mobile || '',
  email: user.email || '',
  country: user.country || '',
  state: user.state || '',
  city: user.city || '',
  pincode: user.pincode || '',
  profilePicture: user.profilePicture || '/profile.jpeg',
})

export default function ProfileComponent() {
  const { data, mutate, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
    fetcher
  )
  const { updateUser } = useUser()


  const [form, setForm] = useState<ProfileData | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState('/profile.jpeg')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    if (data) {
      const mapped = mapApiToForm(data)
      setForm(mapped)
      setPreviewPhoto(mapped.profilePicture || '/profile.jpeg')
    }
  }, [data])

  const handleChange = (key: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev!, [key]: value }))
  }

  /* ✅ FILE PICKER NOW WORKS */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPreviewPhoto(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    try {
      setIsUpdating(true)
      const token = localStorage.getItem('accessToken')

      const fd = new FormData()
      fd.append('prefix', form.prefix)
      fd.append('name', form.fullName)
      fd.append('qualification', form.qualification)
      fd.append('affiliation', form.affiliationHospital)
      fd.append('mobile', form.mobile)
      fd.append('country', form.country)
      fd.append('state', form.state)
      fd.append('city', form.city)
      fd.append('pincode', form.pincode)

      if (photoFile) {
        fd.append('profilePicture', photoFile)
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: fd,
        }
      )

      if (!res.ok) throw new Error('Update failed')

      toast.success('Profile Updated', {
        description: getIndianFormattedDate(),
      })

      // update user context
      updateUser({
        profilePicture: previewPhoto, // instant navbar update
      })


      setIsEditMode(false)
      setPhotoFile(null)
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="bg-[#F6FAFF] rounded-2xl p-6 sm:p-8 shadow-md">
      {/* PROFILE PHOTO */}
      <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6 mb-8">
        <img
          src={previewPhoto}
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover border"
        />

        {isEditMode && (
          <div>
            <Label
              htmlFor="photoUpload"
              className="text-orange-600 cursor-pointer font-medium"
            >
              Change Photo
            </Label>

            <Input
              id="photoUpload" // ✅ LINKED
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={handlePhotoChange}
            />

            <p className="text-xs text-gray-500 mt-1">JPG or PNG • Max 5MB</p>
          </div>
        )}
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {(
          [
            ['prefix', 'Prefix'],
            ['fullName', 'Full Name'],
            ['qualification', 'Qualification'],
            ['affiliationHospital', 'Affiliation'],
            ['mobile', 'Mobile'],
            ['country', 'Country'],
            ['state', 'State'],
            ['city', 'City'],
            ['pincode', 'Pincode'],
          ] as [keyof ProfileData, string][]
        ).map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>
            <Input
              value={form[key] || ''}
              disabled={!isEditMode}
              onChange={(e) => handleChange(key, e.target.value)}
              className={!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}
            />
          </div>
        ))}

        {/* UPDATE BUTTON */}
        {isEditMode && (
          <div className="col-span-full flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-orange-600 hover:bg-orange-700 px-10"
            >
              {isUpdating ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Update Profile'
              )}
            </Button>
          </div>
        )}
      </form>

      {/* EDIT BUTTON */}
      {!isEditMode && (
        <div className="flex justify-center pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditMode(true)}
            className="px-10"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  )
}
