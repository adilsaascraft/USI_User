'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Clock } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'
import { toast } from 'sonner'

/* ---------------- TYPES ---------------- */
type SortOrder = 'newest' | 'oldest'

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


/* ---------------- COMPONENT ---------------- */

export default function CourseList() {
  const user = useAuthStore((state) => state.user)
  const [q, setQ] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  /* dialog */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* 🔥 BACKEND-DRIVEN REGISTERED STATE */
  const [registeredIds, setRegisteredIds] = useState<string[]>([])

  /* ---------------- FETCH COURSES ---------------- */

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: '/api/courses/active',
          method: 'GET',
        })
        setCourses(res.data || [])
      } catch {
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  /* ---------------- FETCH USER REGISTRATIONS ---------------- */

  useEffect(() => {
    if (!user?.id) return

    const fetchRegistrations = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: `/api/course/registrations/${user.id}`,
          method: 'GET',
        })

        const ids = res.data.map((r: any) => r.course._id)
        setRegisteredIds(ids)
      } catch {
        // silent
      }
    }

    fetchRegistrations()
  }, [user?.id])

  /* ---------------- FILTERED COURSES ---------------- */

  const filtered = useMemo(() => {
    let filteredCourses = courses

    if (q.trim()) {
      filteredCourses = filteredCourses.filter((c) =>
        c.courseName.toLowerCase().includes(q.trim().toLowerCase())
      )
    }

    filteredCourses = filteredCourses.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filteredCourses
  }, [courses, q, sortOrder])


  /* ---------------- BUILD REGISTER PAYLOAD ---------------- */

  const buildRegisterPayload = () => {
    if (/^\d{10}$/.test(identifier)) return { mobile: identifier }
    if (identifier.includes('@')) return { email: identifier }
    return { membershipNumber: identifier }
  }

  /* ---------------- REGISTER ---------------- */

  const handleRegister = async () => {
    if (!selectedCourse || !identifier || !user?.id) return

    try {
      setSubmitting(true)

      await apiRequest({
        endpoint: '/api/course/register',
        method: 'POST',
        body: {
          courseId: selectedCourse._id,
          userId: user.id,
          ...buildRegisterPayload(),
        },
      })

      toast.success('You have successfully registered for this course 🎉')

      setRegisteredIds((prev) => [...prev, selectedCourse._id])
      setDialogOpen(false)
      setIdentifier('')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#252641]">E-Learning</h1>
      </div>

      {/* SEARCH + SORT */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses..."
          className="w-full sm:w-80 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#1F5C9E]"
        />

        <Select
          value={sortOrder}
          onValueChange={(v) => setSortOrder(v as SortOrder)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-2xl" />
          ))}

        {!loading &&
          filtered.map((w) => (
            <article
              key={w._id}
              className="bg-white rounded-2xl p-4 shadow hover:-translate-y-2 transition flex flex-col"
            >
              <Image
                src={w.courseImage}
                alt={w.courseName}
                width={480}
                height={260}
                className="rounded-xl h-44 object-cover"
              />

              <h3 className="mt-3 text-base font-semibold text-[#252641] line-clamp-2">
                {w.courseName}
              </h3>

              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} />
                  {w.startDate} – {w.endDate}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  {w.startTime} – {w.endTime}
                </div>
              </div>

              <div className="mt-auto pt-4">
                {registeredIds.includes(w._id) ? (
                  <Link
                    href={`/dashboard/elearning/${w._id}`}
                    className="block text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold"
                  >
                    View Details
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCourse(w)
                      setDialogOpen(true)
                    }}
                    className={`w-full px-4 py-2 rounded-full text-sm font-semibold text-white ${
                      w.registrationType === 'free'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {w.registrationType === 'free'
                      ? 'Register Free'
                      : `₹${w.amount} | Register`}
                  </button>
                )}
              </div>
            </article>
          ))}
      </div>

      {/* REGISTER DIALOG */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          {selectedCourse?.registrationType === 'paid' ? (
            <div className="space-y-4 text-center">
              <h2 className="text-lg font-semibold">
                Payment integration coming soon
              </h2>
              <AlertDialogCancel disabled={submitting}>Close</AlertDialogCancel>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-semibold text-blue-600">
                Register for FREE
              </h2>

              <p className="text-center text-sm text-gray-600">
                Enter your USI membership number / email / phone number
              </p>

              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={submitting}
                placeholder="USI No | Email | Mobile"
                className="w-full border rounded px-4 py-2"
              />

              <button
                onClick={handleRegister}
                disabled={submitting}
                className="w-full bg-[#1F5C9E] text-white py-2 rounded-md"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>

              <AlertDialogCancel className="w-full" disabled={submitting}>
                Cancel
              </AlertDialogCancel>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
