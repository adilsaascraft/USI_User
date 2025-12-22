'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import SpeakerCard from '@/app/components/dashboard/Speakers/SpeakerCard'
import { apiRequest } from '@/lib/apiRequest'

type Speaker = {
  id: string
  name: string
  photo: string
  institute: string
  location: string
  videos: number
}

export default function SpeakersPage() {
  const [search, setSearch] = useState('')
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const res = await apiRequest<null, any>({
          endpoint: '/api/assign-speakers',
          method: 'GET',
        })

        // 🔥 Deduplicate speakers
        const map = new Map<string, Speaker>()

        res.data.forEach((item: any) => {
          const s = item.speakerId
          if (!map.has(s._id)) {
            map.set(s._id, {
              id: s._id,
              name: `${s.prefix} ${s.speakerName}`,
              photo: s.speakerProfilePicture || '/speakers.png',
              institute: s.affiliation || '—',
              location: [s.city, s.state, s.country].filter(Boolean).join(', '),
              videos: 0, // backend doesn’t provide this yet
            })
          }
        })

        setSpeakers([...map.values()])
      } finally {
        setLoading(false)
      }
    }

    fetchSpeakers()
  }, [])

  const filtered = useMemo(() => {
    return speakers.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, speakers])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Speakers</h1>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="pl-9 w-full border rounded-md py-2"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}

        {!loading &&
          filtered.map((speaker) => (
            <SpeakerCard key={speaker.id} speaker={speaker} />
          ))}
      </div>
    </div>
  )
}
