'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useAuthStore } from '@/stores/authStore'
import { apiRequest } from '@/lib/apiRequest'
import { toast } from 'sonner'
import SpeakerHeader from '@/app/components/dashboard/Speakers/SpeakerHeader'

export default function SpeakerDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [speaker, setSpeaker] = useState<any>(null)
  const [webinars, setWebinars] = useState<any[]>([])
  const [registeredIds, setRegisteredIds] = useState<string[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWebinar, setSelectedWebinar] = useState<any>(null)
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: '/api/assign-speakers',
          method: 'GET',
        })

        const filtered = res.data.filter((x: any) => x.speakerId._id === id)

        if (!filtered.length) return

        const s = filtered[0].speakerId

        setSpeaker({
          name: `${s.prefix} ${s.speakerName}`,
          photo: s.speakerProfilePicture,
          qualification: s.degree,
          designation: s.specialization,
          experience: s.experience,
          location: [s.city, s.state, s.country].filter(Boolean).join(', '),
        })

        setWebinars(filtered.map((x: any) => x.webinarId))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  /* ---------------- FETCH REGISTRATIONS ---------------- */

  useEffect(() => {
    if (!user?.id) return

    apiRequest<null, any>({
      endpoint: `/api/webinar/registrations/${user.id}`,
      method: 'GET',
    }).then((res) => {
      setRegisteredIds(res.data.map((r: any) => r.webinar._id))
    })
  }, [user?.id])

  /* ---------------- REGISTER ---------------- */

  const buildPayload = () => {
    if (/^\d{10}$/.test(identifier)) return { mobile: identifier }
    if (identifier.includes('@')) return { email: identifier }
    return { membershipNumber: identifier }
  }

  const handleRegister = async () => {
    if (!user || !selectedWebinar) return

    try {
      setSubmitting(true)

      await apiRequest({
        endpoint: '/api/webinar/register',
        method: 'POST',
        body: {
          webinarId: selectedWebinar._id,
          userId: user.id,
          ...buildPayload(),
        },
      })

      toast.success('You have successfully registered 🎉')
      setRegisteredIds((p) => [...p, selectedWebinar._id])
      setDialogOpen(false)
      setIdentifier('')
    } catch (e: any) {
      toast.error(e.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (!speaker) {
    return <div className="p-10 text-center">Speaker not found</div>
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-500">
        <Link href="/dashboard/speakers" className="text-orange-600">
          Speakers
        </Link>
        <span className="mx-2">{'>'}</span>
        <span className="font-semibold">{speaker.name}</span>
      </div>

      <div className="flex gap-6 items-start">
        {/* LEFT */}
        <div className="flex-1 space-y-6">
          <SpeakerHeader speaker={speaker} />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {webinars.map((w) => (
              <div
                key={w._id}
                className="bg-white rounded-xl shadow p-3 flex flex-col"
              >
                <Image
                  src={w.image}
                  alt={w.name}
                  width={400}
                  height={220}
                  className="rounded-lg object-cover"
                />

                <p className="mt-2 text-sm font-semibold">{w.name}</p>

                {w.dynamicStatus === 'Past' ? (
                  <button
                    disabled
                    className="mt-3 w-full bg-gray-300 text-xs py-2 rounded"
                  >
                    Registration Closed
                  </button>
                ) : registeredIds.includes(w._id) ? (
                  <button
                    onClick={() => router.push(`/dashboard/webinar/${w._id}`)}
                    className="mt-3 w-full bg-blue-600 text-white text-xs py-2 rounded"
                  >
                    View Details
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedWebinar(w)
                      setDialogOpen(true)
                    }}
                    className={`mt-3 w-full text-white text-xs py-2 rounded ${
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
            ))}
          </div>
        </div>

        {/* RIGHT SPONSOR */}
        <div className="w-[260px] shrink-0">
          <div className="bg-white rounded-xl shadow p-4 text-center sticky top-24">
            <p className="text-xs text-gray-500 mb-3">EDUCATIONAL GRANT BY</p>
            <Image
              src="/Sun_Pharma.png"
              alt="Sun Pharma"
              width={60}
              height={60}
            />
          </div>
        </div>
      </div>

      {/* REGISTER DIALOG */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <div className="space-y-4">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={submitting}
              placeholder="USI No | Email | Mobile"
              className="w-full border px-4 py-2 rounded"
            />

            <button
              onClick={handleRegister}
              disabled={submitting}
              className="w-full bg-[#1F5C9E] text-white py-2 rounded"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>

            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
