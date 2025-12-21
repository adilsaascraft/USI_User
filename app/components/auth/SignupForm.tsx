'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getIndianFormattedDate } from '@/lib/formatIndianDate'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'


export default function SignupForm() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    prefix: '',
    name: '',
    email: '',
    mobile: '',
    qualification: '',
    affiliation: '',
    country: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  /* -------------------------------------------------------------------------- */
  /*                                 SUBMIT                                     */
  /* -------------------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name || !form.email || !form.mobile || !form.country) {
      setError('Please fill all required fields.')
      return
    }

    if (!agree) {
      setError('Please accept Terms & Conditions.')
      return
    }

    try {
      setLoading(true)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed')
      }
      toast.success('Signup Successful 🎉 Wait for Admin Approval', {
        description: getIndianFormattedDate(),
      })

      // ⏳ Redirect after 10 seconds
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* LEFT – FORM */}
      <div className="w-full md:w-1/2 p-6 md:p-10 bg-orange-50">
        <h1 className="text-xl font-semibold text-orange-700 mb-5">Sign Up</h1>

        <form onSubmit={handleSubmit}>
          {/* Prefix */}
          <Input
            id="prefix"
            placeholder="Prefix (Dr, Prof, Mr, Ms)"
            value={form.prefix}
            onChange={handleInputChange}
            className="mb-3"
          />

          {/* Full Name */}
          <Input
            id="name"
            placeholder="Full Name *"
            value={form.name}
            onChange={handleInputChange}
            className="mb-3"
          />

          {/* Email */}
          <Input
            id="email"
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleInputChange}
            className="mb-3"
          />

          {/* Mobile */}
          <Input
            id="mobile"
            placeholder="Mobile *"
            value={form.mobile}
            onChange={handleInputChange}
            className="mb-3"
          />

          {/* Qualification */}
          <Input
            id="qualification"
            placeholder="Qualification"
            value={form.qualification}
            onChange={handleInputChange}
            className="mb-3"
          />

          {/* Affiliation */}
          <Input
            id="affiliation"
            placeholder="Affiliation"
            value={form.affiliation}
            onChange={handleInputChange}
            className="mb-3"
          />

          {/* Country */}
          <Select
            value={form.country}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, country: value }))
            }
          >
            <SelectTrigger className="mb-4">
              <SelectValue placeholder="Select Country *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="Australia">Australia</SelectItem>
            </SelectContent>
          </Select>

          {/* Terms */}
          <div className="flex items-start gap-2 mb-4 text-sm">
            <Checkbox
              id="terms"
              checked={agree}
              onCheckedChange={(v) => setAgree(!!v)}
            />
            <label htmlFor="terms">
              I agree to{' '}
              <span className="text-orange-600">Terms & Conditions</span>
            </label>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>

          {/* Login */}
          <p className="text-xs text-center mt-3">
            Already have an account?{' '}
            <span
              onClick={() => router.push('/login')}
              className="text-orange-600 cursor-pointer"
            >
              Login
            </span>
          </p>
        </form>
      </div>

      {/* RIGHT – IMAGE */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-4 bg-white">
        <Image
          src="/signup.png"
          alt="Signup Illustration"
          width={380}
          height={380}
          priority
        />
      </div>
    </div>
  )
}
