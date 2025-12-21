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

const TABS = ['Live', 'Upcoming', 'Past'] as const
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

export default function WebinarList() {
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

  const [registered, setRegistered] = useState<string[]>([])

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/usi/active`
        )
        const json = await res.json()
        setWebinars(json.data || [])
      } catch {
        setWebinars([])
      } finally {
        setLoading(false)
      }
    }

    fetchWebinars()
  }, [])

  /* ---------------- TAB + SEARCH + SORT ---------------- */
  const filtered = useMemo(() => {
    const byTabAndSearch = webinars.filter(
      (w) =>
        w.dynamicStatus === tab &&
        w.name.toLowerCase().includes(q.toLowerCase())
    )

    return byTabAndSearch.sort((a, b) => {
      const aDate = new Date(a.startDate).getTime()
      const bDate = new Date(b.startDate).getTime()
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate
    })
  }, [webinars, tab, q, sortOrder])

  /* ---------------- REGISTER ---------------- */
  const handleRegister = async () => {
    if (!selectedWebinar) return

    try {
      setSubmitting(true)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${selectedWebinar._id}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        }
      )

      if (!res.ok) throw new Error()

      setRegistered((p) => [...p, selectedWebinar._id])
      setDialogOpen(false)
      setIdentifier('')
    } catch {
      alert('Registration failed or already registered')
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

              {/* STATUS */}
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
                {registered.includes(w._id) ? (
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

      {/* ALERT DIALOG */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          {selectedWebinar?.registrationType === 'paid' ? (
            <div className="space-y-4 text-center">
              <h2 className="text-lg font-semibold">
                Payment integration coming soon
              </h2>
              <AlertDialogCancel>Close</AlertDialogCancel>
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

              <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
