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

const TABS = ['Live', 'Upcoming', 'Past', 'All'] as const
type Tab = (typeof TABS)[number]
type SortOrder = 'newest' | 'oldest'

interface Webinar {
  _id: string
  name: string
  webinarType: string
  image: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  registrationType: 'free' | 'paid'
  amount: number
  dynamicStatus: 'Live' | 'Upcoming' | 'Past'
}

/* ---------------- COMPONENT ---------------- */

export default function WebinarList() {
  const user = useAuthStore((state) => state.user)

  const [tab, setTab] = useState<Tab>('Live')
  const [q, setQ] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)

  /* dialog */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* 🔥 BACKEND-DRIVEN REGISTERED STATE */
  const [registeredIds, setRegisteredIds] = useState<string[]>([])

  /* ---------------- FETCH WEBINARS ---------------- */

  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: '/api/webinars/usi/active',
          method: 'GET',
        })
        setWebinars(res.data || [])
      } catch {
        setWebinars([])
      } finally {
        setLoading(false)
      }
    }

    fetchWebinars()
  }, [])

  /* ---------------- FETCH USER REGISTRATIONS ---------------- */

  useEffect(() => {
    if (!user?.id) return

    const fetchRegistrations = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: `/api/webinar/registrations/${user.id}`,
          method: 'GET',
        })

        const ids = res.data.map((r: any) => r.webinar._id)
        setRegisteredIds(ids)
      } catch {
        // silent
      }
    }

    fetchRegistrations()
  }, [user?.id])

  /* ---------------- FILTER + SORT ---------------- */

  const filtered = useMemo(() => {
    const byTab = webinars.filter((w) => {
      if (tab === 'All') return true
      return w.dynamicStatus === tab
    })

    const bySearch = byTab.filter((w) =>
      w.name.toLowerCase().includes(q.toLowerCase())
    )

    return bySearch.sort((a, b) => {
      const aDate = new Date(a.startDate).getTime()
      const bDate = new Date(b.startDate).getTime()
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate
    })
  }, [webinars, tab, q, sortOrder])

  /* ---------------- BUILD REGISTER PAYLOAD ---------------- */

  const buildRegisterPayload = () => {
    if (/^\d{10}$/.test(identifier)) return { mobile: identifier }
    if (identifier.includes('@')) return { email: identifier }
    return { membershipNumber: identifier }
  }

  /* ---------------- REGISTER ---------------- */

  const handleRegister = async () => {
    if (!selectedWebinar || !identifier || !user?.id) return

    try {
      setSubmitting(true)

      await apiRequest({
        endpoint: '/api/webinar/register',
        method: 'POST',
        body: {
          webinarId: selectedWebinar._id,
          userId: user.id,
          ...buildRegisterPayload(),
        },
      })

      toast.success('You have successfully registered for this webinar 🎉')

      setRegisteredIds((prev) => [...prev, selectedWebinar._id])
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
        <h1 className="text-2xl font-semibold text-[#252641]">USI Webinars</h1>

        <div className="mt-4 flex gap-6 border-b pb-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-1 text-sm font-medium ${
                tab === t
                  ? 'text-[#1F5C9E] border-b-2 border-[#1F5C9E]'
                  : 'text-gray-500 hover:text-[#1F5C9E]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH + SORT */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search webinars..."
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
                src={w.image}
                alt={w.name}
                width={480}
                height={260}
                className="rounded-xl h-44 object-cover"
              />

              <span
                className={`mt-3 inline-block w-fit px-3 py-1 text-xs rounded-full font-medium ${
                  w.dynamicStatus === 'Live'
                    ? 'bg-green-100 text-green-700'
                    : w.dynamicStatus === 'Upcoming'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {w.dynamicStatus}
              </span>

              <h3 className="mt-3 text-base font-semibold text-[#252641] line-clamp-2">
                {w.name}
              </h3>

              <p className="text-sm text-gray-500">{w.webinarType}</p>

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
                {w.dynamicStatus === 'Past' ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 rounded-full text-sm font-semibold bg-gray-300 text-gray-600 cursor-not-allowed"
                  >
                    Webinar Closed
                  </button>
                ) : registeredIds.includes(w._id) ? (
                  <Link
                    href={`/dashboard/webinar/${w._id}`}
                    className="block text-center px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold"
                  >
                    View Details
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedWebinar(w)
                      setDialogOpen(true)
                    }}
                    className={`w-full px-4 py-2 rounded-full text-sm font-semibold text-white ${
                      w.registrationType === 'free'
                        ? 'bg-green-600'
                        : 'bg-orange-500'
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
          {selectedWebinar?.registrationType === 'paid' ? (
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
