'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id?: string
  name?: string
  email?: string
  profilePicture?: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  updateUser: (data: Partial<User>) => void
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /* ----------------- INIT USER FROM STORAGE ----------------- */
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser))
    setLoading(false)
  }, [])

  /* ----------------- UPDATE USER (LIVE SYNC) ---------------- */
  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  /* ----------------- LOGOUT ---------------- */
  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // even if API fails, we still logout locally
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <UserContext.Provider
      value={{ user, loading, setUser, updateUser, logout }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
