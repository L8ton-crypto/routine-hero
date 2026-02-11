'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Clock, Users, Target, Lock } from 'lucide-react'
import RoutineBuilder from '@/components/RoutineBuilder'
import ChildrenManager from '@/components/ChildrenManager'

interface Child {
  id: number
  name: string
  age: number
  xp: number
  level: number
  streak: number
  avatar: string
}

interface Task {
  id?: number
  name: string
  icon: string
  duration: number
  points: number
  sort_order?: number
}

interface Routine {
  id: number | string
  name: string
  type: 'morning' | 'afterschool' | 'bedtime'
  tasks: Task[]
  assignedChildren: number[]
}

interface RecentActivity {
  id: number
  child_name: string
  avatar: string
  routine_name: string
  xp_earned: number
  completed_at: string
}

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'children' | 'builder'>('overview')
  const [familyChildren, setFamilyChildren] = useState<Child[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [familyId, setFamilyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [pinVerified, setPinVerified] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [stats, setStats] = useState({ totalXP: 0, avgLevel: 0, longestStreak: 0, routineCount: 0, todayCompletions: 0 })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('rh_family')
    if (stored) {
      const fam = JSON.parse(stored)
      setFamilyId(fam.id)
      // Check if parent already verified this session
      const verified = sessionStorage.getItem('rh_pin_verified')
      if (verified === String(fam.id)) {
        setPinVerified(true)
      }
    }
  }, [])

  const verifyPin = async () => {
    if (!familyId || pin.length !== 4) return
    try {
      const res = await fetch('/api/family/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, pin })
      })
      const data = await res.json()
      if (data.ok) {
        setPinVerified(true)
        sessionStorage.setItem('rh_pin_verified', String(familyId))
      } else {
        setPinError('Incorrect PIN')
      }
    } catch {
      setPinError('Failed to verify PIN')
    }
  }

  const loadData = useCallback(async () => {
    if (!familyId) return
    setLoading(true)
    try {
      const [childRes, routineRes, progressRes] = await Promise.all([
        fetch(`/api/children?familyId=${familyId}`),
        fetch(`/api/routines?familyId=${familyId}`),
        fetch(`/api/progress?familyId=${familyId}`)
      ])
      const childData = await childRes.json()
      const routineData = await routineRes.json()
      const progressData = await progressRes.json()

      setFamilyChildren(childData.children || [])
      setRoutines(routineData.routines || [])
      if (progressData.stats) setStats(progressData.stats)
      if (progressData.recentActivity) setRecentActivity(progressData.recentActivity)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    if (pinVerified && familyId) loadData()
  }, [pinVerified, familyId, loadData])

  const handleNewRoutine = () => {
    setEditingRoutine({
      id: 'new',
      name: '',
      type: 'morning',
      tasks: [],
      assignedChildren: []
    })
    setActiveTab('builder')
  }

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine)
    setActiveTab('builder')
  }

  const handleSaveRoutine = async (routine: Routine) => {
    if (!familyId) return
    try {
      if (routine.id === 'new') {
        await fetch('/api/routines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyId,
            name: routine.name,
            type: routine.type,
            tasks: routine.tasks,
            assignedChildren: routine.assignedChildren
          })
        })
      } else {
        await fetch('/api/routines', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: routine.id,
            name: routine.name,
            type: routine.type,
            tasks: routine.tasks,
            assignedChildren: routine.assignedChildren
          })
        })
      }
      setEditingRoutine(null)
      setActiveTab('routines')
      loadData()
    } catch (e) {
      console.error('Failed to save routine:', e)
    }
  }

  const handleDeleteRoutine = async (routineId: number | string) => {
    try {
      await fetch('/api/routines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: routineId })
      })
      loadData()
    } catch (e) {
      console.error('Failed to delete routine:', e)
    }
  }

  // PIN gate
  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-sm w-full mx-4 border-2 border-white/20 text-center">
          <div className="w-20 h-20 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Parent Mode</h2>
          <p className="text-white/70 mb-6">Enter your 4-digit PIN to continue</p>
          <input
            type="password"
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError('') }}
            onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
            className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] placeholder-white/30 focus:outline-none focus:border-white/50 mb-4"
            placeholder="• • • •"
            autoFocus
          />
          {pinError && <p className="text-red-300 text-sm mb-4">{pinError}</p>}
          <button
            onClick={verifyPin}
            disabled={pin.length !== 4}
            className="w-full bg-blue-500/30 hover:bg-blue-500/40 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all"
          >
            Unlock
          </button>
          <Link href="/" className="block mt-4 text-white/50 hover:text-white/80 text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all">
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
          </div>
          <div className="text-white/80 text-sm">
            {familyChildren.length} {familyChildren.length === 1 ? 'child' : 'children'}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'routines', label: 'Routines', icon: Clock },
            { id: 'children', label: 'Children', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'routines' | 'children')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-6 text-white">
                  <div className="text-3xl font-bold">{stats.totalXP}</div>
                  <div className="opacity-90">Total XP Earned</div>
                </div>
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="text-3xl font-bold">{stats.avgLevel}</div>
                  <div className="opacity-90">Average Level</div>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl p-6 text-white">
                  <div className="text-3xl font-bold">{stats.longestStreak}</div>
                  <div className="opacity-90">Longest Streak</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={handleNewRoutine}
                  className="bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 rounded-2xl p-8 text-center transition-all group"
                >
                  <Plus className="w-12 h-12 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-white mb-2">Create New Routine</h3>
                  <p className="text-white/70">Build a custom routine for your kids</p>
                </button>
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                  {recentActivity.length === 0 ? (
                    <p className="text-white/50">No activity yet. Create routines and let your kids start completing them!</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 text-white/80">
                          <span className="text-2xl">{activity.avatar}</span>
                          <div className="flex-1">
                            <span className="font-semibold">{activity.child_name}</span> completed{' '}
                            <span className="font-semibold">{activity.routine_name}</span>
                          </div>
                          <span className="text-yellow-300 text-sm font-bold">+{activity.xp_earned} XP</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Stats */}
              <div className="bg-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Today</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{stats.todayCompletions}</div>
                    <div className="text-white/70">Routines Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{stats.routineCount}</div>
                    <div className="text-white/70">Active Routines</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'routines' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Manage Routines</h2>
                <button
                  onClick={handleNewRoutine}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-white font-semibold transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Routine</span>
                </button>
              </div>

              {routines.length === 0 ? (
                <div className="text-center py-16 text-white/50">
                  <p className="text-lg mb-4">No routines yet</p>
                  <button
                    onClick={handleNewRoutine}
                    className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-white font-semibold transition-all"
                  >
                    Create your first routine
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {routines.map((routine) => (
                    <div key={routine.id} className="bg-white/10 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {routine.type === 'morning' ? '🌅' : routine.type === 'afterschool' ? '🏠' : '🌙'}
                          </span>
                          <h3 className="text-xl font-bold text-white">{routine.name}</h3>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRoutine(routine)}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white font-semibold transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this routine?')) handleDeleteRoutine(routine.id)
                            }}
                            className="bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg text-white font-semibold transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {routine.tasks.map((task, i) => (
                          <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-white text-sm">
                            {task.icon} {task.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-white/70 text-sm">
                        <span>
                          Assigned to: {routine.assignedChildren.length === 0 ? 'No one' :
                            routine.assignedChildren.map(id =>
                              familyChildren.find(c => c.id === id)?.name
                            ).filter(Boolean).join(', ')}
                        </span>
                        <span>{routine.tasks.reduce((s, t) => s + t.duration, 0)} min • {routine.tasks.reduce((s, t) => s + t.points, 0)} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'children' && (
            <ChildrenManager
              familyChildren={familyChildren}
              familyId={familyId!}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'builder' && editingRoutine && (
            <RoutineBuilder
              routine={editingRoutine}
              familyChildren={familyChildren}
              onSave={handleSaveRoutine}
              onCancel={() => {
                setEditingRoutine(null)
                setActiveTab('routines')
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
