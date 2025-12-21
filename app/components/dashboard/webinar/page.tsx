'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Clock, ChevronDown } from 'lucide-react'
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog'

const TABS = ['Live', 'Upcoming', 'Past'] as const
type Tab = (typeof TABS)[number]
type Sort = 'newest' | 'popularity'

interface Webinar {
  _id: string
  name: string
  image: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  registrationType: 'free' | 'paid'
  amount: number
  dynamicStatus: string
}

export default function WebinarList() {
  const [tab, setTab] = useState<Tab>('Live')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)

  /* dialog state */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* registered webinars */
  const [registered, setRegistered] = useState<string[]>([])

  const now = new Date()
  const sortRef = useRef<HTMLDivElement | null>(null)

  /* ---------------- FETCH WEBINARS ---------------- */
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

  /* ---------------- SORT DROPDOWN CLOSE ---------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  /* ---------------- FILTER + SORT ---------------- */
  const filtered = useMemo(() => {
    const inTab = webinars.filter((w) => {
      const s = new Date(w.startDate)
      const e = new Date(w.endDate)
      if (tab === 'Live') return s <= now && e >= now
      if (tab === 'Upcoming') return s > now
      return e < now
    })

    const searched = q
      ? inTab.filter((w) => w.name.toLowerCase().includes(q.toLowerCase()))
      : inTab

    return searched.sort((a, b) =>
      sort === 'newest' ? +new Date(b.startDate) - +new Date(a.startDate) : 0
    )
  }, [tab, q, sort, webinars])

  /* ---------------- REGISTER HANDLER ---------------- */
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

      if (!res.ok) throw new Error('Registration failed')

      setRegistered((prev) => [...prev, selectedWebinar._id])
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
      <div className="mb-4 flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#252641]">
            USI Webinars
          </h1>

          <div className="mt-3 flex gap-6 border-b pb-3">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`capitalize pb-1 text-sm ${
                  tab === t
                    ? 'text-[#1F5C9E] border-b-2 border-[#1F5C9E] font-semibold'
                    : 'text-gray-500 hover:text-[#1F5C9E]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* SORT */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setSortOpen((s) => !s)}
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 bg-orange-50 text-orange-600 text-sm font-medium"
          >
            Sort By <ChevronDown size={14} />
          </button>

          {sortOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-md border shadow-lg z-50">
              <button
                onClick={() => {
                  setSort('newest')
                  setSortOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                Newest First
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search webinars..."
        className="mb-6 w-full md:w-96 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#1F5C9E]"
      />

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((w) => (
          <article
            key={w._id}
            className="bg-white rounded-2xl p-4 card-shadow hover:-translate-y-2 transition"
          >
            <Image
              src={w.image}
              alt={w.name}
              width={480}
              height={260}
              className="rounded-xl h-44 object-cover"
            />

            <h3 className="mt-4 font-semibold line-clamp-2">{w.name}</h3>

            <div className="mt-4 flex justify-center">
              {registered.includes(w._id) ? (
                <Link
                  href={`/dashboard/webinar/${w._id}`}
                  className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-full"
                >
                  View Details
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSelectedWebinar(w)
                    setDialogOpen(true)
                  }}
                  className={`w-full px-4 py-2 rounded-full text-white ${
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
            <p className="text-center text-lg font-semibold">
              Payment integration coming soon
            </p>
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
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
