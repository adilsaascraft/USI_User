'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function AuthHydrator({
  children,
}: {
  children: React.ReactNode
}) {
  const hydrateUser = useAuthStore((state) => state.hydrateUser)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  useEffect(() => {
    hydrateUser()
  }, [hydrateUser])

  // Optional: prevent flicker
  if (!isHydrated) return null

  return <>{children}</>
}
