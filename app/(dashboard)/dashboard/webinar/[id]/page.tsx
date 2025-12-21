'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

import { facultyByWebinar } from '@/app/data/webinar/faculty'
import { faqByWebinar } from '@/app/data/webinar/faq'
import { feedbackByWebinar } from '@/app/data/webinar/feedback'
import { quizByWebinar, quizMetaByWebinar } from '@/app/data/webinar/quiz'

import Overview from '@/app/components/dashboard/webinar/tabs/Overview'
import Faculty from '@/app/components/dashboard/webinar/tabs/Faculty'
import FAQ from '@/app/components/dashboard/webinar/tabs/FAQ'
import Feedback from '@/app/components/dashboard/webinar/tabs/Feedback'
import Quiz from '@/app/components/dashboard/webinar/tabs/Quiz'

import { CalendarDays, Clock, CheckCircle } from 'lucide-react'

/* ================= TYPES ================= */
type TabType = 'overview' | 'faculty' | 'faq' | 'feedback' | 'quiz'

interface WebinarApi {
  _id: string
  name: string
  streamLink: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  dynamicStatus: string
  description: string
}

export default function WebinarDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const webinarId = params.id

  const [tab, setTab] = useState<TabType>('overview')
  const [webinar, setWebinar] = useState<WebinarApi | null>(null)
  const [loading, setLoading] = useState(true)

  const faculty = facultyByWebinar[Number(webinarId)] ?? []
  const faq = faqByWebinar[Number(webinarId)] ?? []
  const feedbackCfg = feedbackByWebinar[Number(webinarId)] ?? {
    placeholder: 'Share your feedback...',
  }
  const quiz = quizByWebinar[Number(webinarId)] ?? []

  /* ================= FETCH WEBINAR ================= */
  useEffect(() => {
    const fetchWebinar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/active/${webinarId}`
        )
        const json = await res.json()
        if (json.success) {
          setWebinar(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch webinar', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWebinar()
  }, [webinarId])

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!webinar) {
    return <div className="p-8 text-center">Webinar not found</div>
  }

  const questionsCount = quiz.length
  const perQuestionSeconds =
    quizMetaByWebinar[Number(webinarId)]?.perQuestionSeconds ?? 30

  const durationMinutes =
    Math.ceil((questionsCount * perQuestionSeconds) / 60) || 5

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ===== Breadcrumb ===== */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push('/dashboard/webinar')}
          className="text-orange-600 font-medium hover:underline"
        >
          Webinar
        </button>
        <span className="text-gray-400">{'>'}</span>
        <span className="text-gray-600 font-medium">{webinar.name}</span>
      </div>

      {/* ===== Layout ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="relative w-full pt-[56.25%]">
              <iframe
                src={webinar.streamLink}
                title={webinar.name}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>

            <div className="p-6">
              <h1 className="text-2xl font-semibold text-[#252641]">
                {webinar.name}
              </h1>

              {/* ===== META ===== */}
              <div className="mt-3 text-sm text-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  <span>
                    {webinar.startDate} – {webinar.endDate}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>
                      {webinar.startTime} – {webinar.endTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black inline-block" />
                    <span className="font-medium text-green-600">
                      {webinar.dynamicStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-6 flex gap-4">
                <button
                  disabled
                  className="px-5 py-2 bg-gray-300 text-gray-600 rounded-full flex items-center gap-2 cursor-not-allowed"
                >
                  <CheckCircle size={16} />
                  Registered
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex gap-3 border-b pb-3">
              {(
                ['overview', 'faculty', 'faq', 'feedback', 'quiz'] as TabType[]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`capitalize px-3 py-1.5 rounded-md text-sm ${
                    tab === t
                      ? 'bg-[#E8F3FF] text-[#1F5C9E] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {tab === 'overview' && (
                <Overview
                  description={webinar.description}
                  comments={[]}
                  commentText=""
                  setCommentText={() => {}}
                  onAddComment={() => {}}
                />
              )}
              {tab === 'faculty' && <Faculty faculty={faculty} />}
              {tab === 'faq' && <FAQ faq={faq} />}
              {tab === 'feedback' && (
                <Feedback cfg={feedbackCfg} webinarId={Number(webinarId)} />
              )}
              {tab === 'quiz' && (
                <Quiz
                  title={webinar.name}
                  subtitle="Subsection"
                  durationMinutes={`${durationMinutes} Minutes`}
                  questionsCount={questionsCount}
                  perQuestionSeconds={perQuestionSeconds}
                  onStart={() =>
                    router.push(`/dashboard/webinar/${webinarId}/quiz-runner`)
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-2xl shadow p-6 sticky top-6 h-fit flex flex-col items-center">
          <p className="text-xs text-gray-500 mb-4">EDUCATIONAL GRANT BY</p>
          <Image
            src="/Sun_Pharma.png"
            alt="Sun Pharma"
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  )
}
