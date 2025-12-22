'use client'

import { create } from 'zustand'
import { apiRequest } from '@/lib/apiRequest'

/**
 * Backend user shape
 */
export type AuthUser = {
  id: string
  name: string
  email: string
  mobile?: string
  membershipNumber?: string
  role: 'user'
  status: 'Pending' | 'Approved'
  profilePicture?: string
  qualification?: string
  affiliation?: string
  country?: string
  city?: string
  state?: string
  pincode?: string
}

/**
 * Auth store state
 */
type AuthState = {
  user: AuthUser | null
  isHydrated: boolean

  /**
   * Set user after login
   */
  setUser: (user: AuthUser, token: string) => void

  /**
   * Update user partially (profile updates, avatar updates, etc.)
   * This triggers instant UI updates (navbar, profile, etc.)
   */
  updateUser: (data: Partial<AuthUser>) => void

  /**
   * Fetch profile from backend using existing token
   */
  hydrateUser: () => Promise<void>

  /**
   * Logout user
   */
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,

  /**
   * Store token + user after login
   */
  setUser: (user, token) => {
    localStorage.setItem('token', token)
    set({ user })
  },

  /**
   * 🔥 THIS IS THE KEY METHOD YOU ASKED FOR
   * Updates user state instantly across the app
   */
  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : state.user,
    }))
  },

  /**
   * Fetch profile on app load / refresh
   */
  hydrateUser: async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      set({ user: null, isHydrated: true })
      return
    }

    try {
      const profile = await apiRequest<null, any>({
        endpoint: '/api/users/profile',
        method: 'GET',
      })

      set({
        user: {
          id: profile._id ?? profile.id,
          name: profile.name,
          email: profile.email,
          mobile: profile.mobile,
          membershipNumber: profile.membershipNumber,
          role: 'user',
          status: profile.status,
          profilePicture: profile.profilePicture,
          qualification: profile.qualification,
          affiliation: profile.affiliation,
          country: profile.country,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
        },
        isHydrated: true,
      })
    } catch {
      // token invalid / refresh failed
      localStorage.removeItem('token')
      set({ user: null, isHydrated: true })
    }
  },

  /**
   * Logout user (backend + frontend)
   */
  logout: async () => {
    try {
      await apiRequest({
        endpoint: '/api/users/logout',
        method: 'POST',
      })
    } catch {
      // even if backend fails, continue logout
    } finally {
      localStorage.removeItem('token')
      set({ user: null, isHydrated: true })
    }
  },
}))
