'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Search, CalendarDays, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

/* =========================
   BACKEND RESPONSE TYPES
========================= */

type Webinar = {
  _id: string
  name: string
  image: string
  webinarType: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  dynamicStatus: string
}

type Registration = {
  id: string
  webinar: Webinar
  registeredOn: string
}

/* ========================= */

export default function MyLearningPage() {
  const [search, setSearch] = useState('')
  const [courses, setCourses] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  /* =========================
     GET userId FROM TOKEN
  ========================= */
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload?.id || payload?._id
    } catch {
      return null
    }
  }

  /* =========================
     FETCH API
  ========================= */
  useEffect(() => {
    const userId = getUserIdFromToken()

    if (!userId) {
      setLoading(false)
      return
    }

    const fetchMyLearning = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/webinar/registrations/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        const json = await res.json()

        if (json.success) {
          setCourses(json.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch registrations', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMyLearning()
  }, [])

  /* =========================
     SEARCH
  ========================= */
  const query = search.trim().toLowerCase()

  const filteredCourses = courses.filter((item) =>
    item.webinar.name.toLowerCase().includes(query)
  )

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6 text-[#0d2540]">My Courses</h1>

      {/* Search */}
      <div className="relative mb-8 w-full max-w-sm">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title"
          className="pl-10 pr-5 py-2 w-full border rounded-lg"
        />
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center text-gray-500">Loading courses...</p>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map(({ id, webinar }) => (
            <div
              key={id}
              className="bg-white rounded-2xl overflow-hidden flex flex-col card-shadow hover:-translate-y-2 transition"
            >
              <Image
                src={webinar.image}
                alt={webinar.name}
                width={480}
                height={260}
                className="object-cover w-full h-44"
              />

              <div className="p-4 flex flex-col flex-grow">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    {webinar.startDate} - {webinar.endDate}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {webinar.startTime} - {webinar.endTime}
                  </div>
                </div>

                <h3 className="mt-2 font-semibold line-clamp-2">
                  {webinar.name}
                </h3>

                <div className="mt-auto pt-4 flex justify-center">
                  <Button
                    onClick={() =>
                      router.push(`/dashboard/webinar/${webinar._id}`)
                    }
                    className="w-32"
                  >
                    View Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCourses.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No registered courses found.
        </p>
      )}
    </div>
  )
}
