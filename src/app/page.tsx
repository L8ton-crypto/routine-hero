'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, Settings, Users, LogIn, Plus } from 'lucide-react'

interface Family {
  id: number
  name: string
  code: string
}

export default function HomePage() {
  const [mode, setMode] = useState<'landing' | 'create' | 'join'>('landing')
  const [family, setFamily] = useState<Family | null>(null)
  const [familyName, setFamilyName] = useState('')
  const [pin, setPin] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check localStorage for existing family
    const stored = localStorage.getItem('rh_family')
    if (stored) {
      try {
        setFamily(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

  const createFamily = async () => {
    if (!familyName.trim() || pin.length !== 4) {
      setError('Enter a family name and 4-digit PIN')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName, pin })
      })
      const data = await res.json()
      if (data.ok) {
        const fam = data.family
        localStorage.setItem('rh_family', JSON.stringify(fam))
        localStorage.setItem('rh_is_parent', 'true')
        setFamily(fam)
      } else {
        setError(data.error || 'Failed to create family')
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const joinFamily = async () => {
    if (!joinCode.trim()) {
      setError('Enter a family code')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode })
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem('rh_family', JSON.stringify(data.family))
        setFamily(data.family)
      } else {
        setError(data.error || 'Family not found')
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const leaveFamily = () => {
    localStorage.removeItem('rh_family')
    localStorage.removeItem('rh_is_parent')
    localStorage.removeItem('rh_child_id')
    setFamily(null)
    setMode('landing')
  }

  // If family is set, show mode selection
  if (family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              🦸‍♀️ RoutineHero 🦸‍♂️
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Turn daily routines into epic adventures!
            </p>
            <div className="mt-4 inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm">
              <Users className="w-4 h-4 mr-2" />
              {family.name} — Code: <span className="font-mono font-bold ml-1">{family.code}</span>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Parent Mode */}
            <Link href="/parent" className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20 hover:border-white/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500/30 transition-all">
                    <Settings className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Parent Mode</h2>
                  <p className="text-white/80 text-lg">
                    Set up routines, manage rewards, and track progress
                  </p>
                </div>
              </div>
            </Link>

            {/* Kid Mode */}
            <Link href="/kid" className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20 hover:border-white/40 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-500/30 transition-all">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Kid Mode</h2>
                  <p className="text-white/80 text-lg">
                    Complete routines, earn XP, and unlock rewards!
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Leave Family */}
          <div className="text-center mt-8">
            <button
              onClick={leaveFamily}
              className="text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              Switch or leave family
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Onboarding: Create or Join
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🦸‍♀️ RoutineHero 🦸‍♂️
          </h1>
          <p className="text-lg text-white/90">
            Turn daily routines into epic adventures!
          </p>
        </div>

        {mode === 'landing' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('create'); setError('') }}
              className="w-full bg-white/15 backdrop-blur-sm hover:bg-white/25 border-2 border-white/30 rounded-2xl p-6 text-left transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-green-500/30 rounded-full flex items-center justify-center group-hover:bg-green-500/40 transition-all">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Create Family</h3>
                  <p className="text-white/70">Start a new family and get a join code</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setMode('join'); setError('') }}
              className="w-full bg-white/15 backdrop-blur-sm hover:bg-white/25 border-2 border-white/30 rounded-2xl p-6 text-left transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-500/30 rounded-full flex items-center justify-center group-hover:bg-blue-500/40 transition-all">
                  <LogIn className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Join Family</h3>
                  <p className="text-white/70">Enter a code to join an existing family</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Create Your Family</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Family Name</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                  placeholder="The Smiths"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Parent PIN (4 digits)</label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 text-center text-2xl tracking-widest"
                  placeholder="• • • •"
                />
              </div>
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => { setMode('landing'); setError('') }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={createFamily}
                  disabled={loading}
                  className="flex-1 bg-green-500/30 hover:bg-green-500/40 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Family'}
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Join a Family</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Family Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 text-center text-xl tracking-widest font-mono"
                  placeholder="HERO-XXXX"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => { setMode('landing'); setError('') }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Back
                </button>
                <button
                  onClick={joinFamily}
                  disabled={loading}
                  className="flex-1 bg-blue-500/30 hover:bg-blue-500/40 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Family'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
