'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, CalendarDays, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'

/* =========================
   BACKEND RESPONSE TYPES
========================= */

interface Course {
  _id: string
  id: string
  courseName: string
  courseImage: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeZone: string
  registrationType: 'free' | 'paid'
  amount: number
  status: 'Active' | 'Inactive'
  streamLink: string
  description: string
  createdAt: string
  updatedAt: string
  __v: number
}

type Registration = {
  id: string
  course: Course
  registeredOn: string
}

/* ========================= */

export default function MyLearningPage() {
  const [search, setSearch] = useState('')
  const [courses, setCourses] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  /* =========================
     FETCH REGISTERED COURSES
  ========================= */
  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchMyLearning = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: `/api/course/registrations/${user.id}`,
          method: 'GET',
        })

        setCourses(res.data || [])
      } catch (error) {
        console.error('Failed to fetch registered courses', error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchMyLearning()
  }, [user?.id])

  /* =========================
     SEARCH
  ========================= */
  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return courses

    return courses.filter((item) => item.course.courseName.toLowerCase().includes(q))
  }, [search, courses])

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
          {filteredCourses.map(({ id, course }) => (
            <div
              key={id}
              className="bg-white rounded-2xl overflow-hidden flex flex-col card-shadow hover:-translate-y-2 transition"
            >
              <Image
                src={course.courseImage}
                alt={course.courseName}
                width={480}
                height={260}
                className="object-cover w-full h-44"
              />

              <div className="p-4 flex flex-col flex-grow">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    {course.startDate} - {course.endDate}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {course.startTime} - {course.endTime}
                  </div>
                </div>

                <h3 className="mt-2 font-semibold line-clamp-2">
                  {course.courseName}
                </h3>

                <div className="mt-auto pt-4 flex justify-center">
                  <Button
                    onClick={() =>
                      router.push(`/dashboard/elearning/${course._id}`)
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Course
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
