'use client'

import ProfileComponent from '@/app/components/dashboard/myprofile/ProfileComponent'

export default function MyProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Profile</h1>

      {/* Profile component handles:
          - GET profile (SWR)
          - loading
          - error
          - update
      */}
      <ProfileComponent />
    </div>
  )
}
