'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'

/* ✅ SAFE IMAGE URL */
const getImageUrl = (path?: string | null): string => {
  if (!path) return '/avatar.png'

  if (path.startsWith('blob:')) return path
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const base = process.env.NEXT_PUBLIC_API_URL
  if (!base) return '/avatar.png'

  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export default function DashboardHeader() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [imgError, setImgError] = useState(false)

  const profileSrc = imgError
    ? '/avatar.png'
    : getImageUrl((user as any)?.profilePicture)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-r from-[#B5D9FF] to-[#D6E7FF] shadow-md flex items-center justify-between px-8 z-50">
      {/* LEFT */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push('/dashboard/mylearning')}
      >
        <img
          src="/urological.png"
          alt="Urological Society of India"
          className="h-12"
        />

        <div className="h-10 w-[1px] bg-[#1F5C9E] mx-3" />

        <div className="flex items-center gap-2">
          <img
            src="/ISU_Logo.png"
            alt="Indian School of Urology"
            className="h-12"
          />
          <p className="text-sm font-bold text-[#1F5C9E] leading-tight">
            Indian School <br /> of Urology
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">
        <button onClick={() => router.push('/dashboard/myprofile')}>
          {!user ? (
            <Skeleton className="w-[45px] h-[45px] rounded-full" />
          ) : (
            <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img
                src={profileSrc}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="bg-orange-500 text-white font-semibold px-6 py-2 rounded-full hover:bg-orange-600 transition"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
