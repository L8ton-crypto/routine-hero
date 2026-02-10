import Link from 'next/link'
import { Play, Settings, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🦸‍♀️ RoutineHero 🦸‍♂️
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Turn daily routines into epic adventures! Build habits, earn rewards, and become the hero of your day.
          </p>
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
                  Set up routines, manage rewards, and track your kids' progress
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
                  Complete your routines, earn XP, and unlock awesome rewards!
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-white">3</div>
              <div className="text-white/70">Active Routines</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">247</div>
              <div className="text-white/70">XP Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">🏆</div>
              <div className="text-white/70">Level 5</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}