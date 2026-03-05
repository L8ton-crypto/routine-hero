'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Clock, Users, Target, Lock, Award, Gift, Trophy } from 'lucide-react'
import RoutineBuilder from '@/components/RoutineBuilder'
import ChildrenManager from '@/components/ChildrenManager'
import { BADGE_DEFINITIONS, Badge, Reward, RewardClaim } from '@/lib/types'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'children' | 'badges' | 'rewards' | 'leaderboard' | 'builder'>('overview')
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
  const [badges, setBadges] = useState<Badge[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([])
  const [showAddReward, setShowAddReward] = useState(false)
  const [newReward, setNewReward] = useState({ title: '', description: '', xpCost: 100, icon: '🎁' })

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
      const [childRes, routineRes, progressRes, extendedRes] = await Promise.all([
        fetch(`/api/children?familyId=${familyId}`),
        fetch(`/api/routines?familyId=${familyId}`),
        fetch(`/api/progress?familyId=${familyId}`),
        fetch(`/api/family-extended?familyId=${familyId}`)
      ])
      const childData = await childRes.json()
      const routineData = await routineRes.json()
      const progressData = await progressRes.json()
      const extendedData = await extendedRes.json()

      setFamilyChildren(childData.children || [])
      setRoutines(routineData.routines || [])
      if (progressData.stats) setStats(progressData.stats)
      if (progressData.recentActivity) setRecentActivity(progressData.recentActivity)
      if (extendedData.badges) setBadges(extendedData.badges)
      if (extendedData.rewards) setRewards(extendedData.rewards)
      if (extendedData.rewardClaims) setRewardClaims(extendedData.rewardClaims)
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

  const handleAddReward = async () => {
    if (!familyId || !newReward.title || !newReward.xpCost) return
    try {
      await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          title: newReward.title,
          description: newReward.description,
          xpCost: newReward.xpCost,
          icon: newReward.icon
        })
      })
      setNewReward({ title: '', description: '', xpCost: 100, icon: '🎁' })
      setShowAddReward(false)
      loadData()
    } catch (e) {
      console.error('Failed to add reward:', e)
    }
  }

  const handleClaimReward = async (rewardId: string, childId: number) => {
    try {
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId, childId })
      })
      const data = await res.json()
      if (!data.ok) {
        alert(data.error)
        return
      }
      loadData()
    } catch (e) {
      console.error('Failed to claim reward:', e)
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    try {
      await fetch('/api/rewards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rewardId })
      })
      loadData()
    } catch (e) {
      console.error('Failed to delete reward:', e)
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
        <div className="flex flex-wrap gap-1 mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'routines', label: 'Routines', icon: Clock },
            { id: 'children', label: 'Children', icon: Users },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'rewards', label: 'Rewards', icon: Gift },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
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

          {activeTab === 'badges' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">🏅 Family Badges</h2>
              {familyChildren.map((child) => {
                const childBadges = badges.filter(b => b.child_id === child.id);
                return (
                  <div key={child.id} className="bg-white/10 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-3xl">{child.avatar}</span>
                      <h3 className="text-xl font-bold text-white">{child.name}'s Badges</h3>
                      <span className="text-white/60">({childBadges.length} earned)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {Object.entries(BADGE_DEFINITIONS).map(([key, badge]) => {
                        const earned = childBadges.some(b => b.badge_type === key);
                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-xl border text-center transition-all ${
                              earned
                                ? 'bg-amber-500/20 border-amber-500/40'
                                : 'bg-white/5 border-white/10 opacity-40'
                            }`}
                          >
                            <div className={`text-3xl mb-2 ${earned ? '' : 'grayscale'}`}>
                              {badge.icon}
                            </div>
                            <div className="font-semibold text-sm text-white">{badge.name}</div>
                            <div className="text-xs text-white/60 mt-1">{badge.description}</div>
                            {earned && (
                              <div className="text-xs text-amber-400 mt-2">Earned!</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">🎁 Reward Shop</h2>
                <button
                  onClick={() => setShowAddReward(true)}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-white font-semibold transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Reward</span>
                </button>
              </div>

              {rewards.length === 0 ? (
                <div className="text-center py-16 text-white/50">
                  <p className="text-lg mb-4">No rewards yet</p>
                  <button
                    onClick={() => setShowAddReward(true)}
                    className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-white font-semibold transition-all"
                  >
                    Add your first reward
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="bg-white/10 rounded-2xl p-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <span className="text-3xl">{reward.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{reward.title}</h3>
                          {reward.description && (
                            <p className="text-white/60 text-sm mt-1">{reward.description}</p>
                          )}
                          <div className="text-amber-400 font-bold text-sm mt-2">
                            {reward.xp_cost} XP
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {familyChildren.map((child) => {
                          const canAfford = child.xp >= reward.xp_cost;
                          return (
                            <div key={child.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{child.avatar}</span>
                                <span className="text-white text-sm">{child.name}</span>
                                <span className="text-white/60 text-xs">({child.xp} XP)</span>
                              </div>
                              <button
                                onClick={() => handleClaimReward(reward.id, child.id)}
                                disabled={!canAfford}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {canAfford ? 'Claim' : 'Need more XP'}
                              </button>
                            </div>
                          );
                        })}
                        <button
                          onClick={() => handleDeleteReward(reward.id)}
                          className="w-full px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
                        >
                          Delete Reward
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rewardClaims.length > 0 && (
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Recent Claims</h3>
                  <div className="space-y-2">
                    {rewardClaims.slice(0, 5).map((claim) => (
                      <div key={claim.id} className="flex items-center space-x-3 text-white/80">
                        <span className="text-xl">{claim.child_avatar}</span>
                        <span className="font-semibold">{claim.child_name}</span>
                        <span>claimed</span>
                        <span className="text-xl">{claim.reward_icon}</span>
                        <span className="font-semibold">{claim.reward_title}</span>
                        <span className="text-green-400 text-sm ml-auto">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">🏆 Family Leaderboard</h2>
              <div className="space-y-4">
                {familyChildren
                  .sort((a, b) => b.xp - a.xp)
                  .map((child, index) => {
                    const childBadges = badges.filter(b => b.child_id === child.id);
                    return (
                      <div
                        key={child.id}
                        className={`flex items-center gap-6 p-6 rounded-2xl border transition-all ${
                          index === 0
                            ? 'bg-yellow-500/20 border-yellow-500/40'
                            : index === 1
                            ? 'bg-gray-500/20 border-gray-500/40'
                            : index === 2
                            ? 'bg-amber-800/20 border-amber-800/40'
                            : 'bg-white/10 border-white/20'
                        }`}
                      >
                        <div className="text-3xl font-bold text-white/60 w-12 text-center">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </div>
                        <span className="text-4xl">{child.avatar}</span>
                        <div className="flex-1">
                          <div className="font-bold text-xl text-white">{child.name}</div>
                          <div className="text-white/60">Level {child.level} • {child.streak} day streak</div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 font-bold text-2xl">
                            {child.xp} XP
                          </div>
                          <div className="text-white/60 text-sm">
                            {childBadges.length} badges
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
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

      {/* Add Reward Modal */}
      {showAddReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddReward(false)}>
          <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-3xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6">🎁 Add Reward</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newReward.title}
                onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                placeholder="Reward title"
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                autoFocus
              />
              <input
                type="text"
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
              />
              <div className="flex space-x-4">
                <input
                  type="number"
                  value={newReward.xpCost}
                  onChange={(e) => setNewReward({ ...newReward, xpCost: parseInt(e.target.value) || 100 })}
                  placeholder="XP Cost"
                  className="flex-1 bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                />
                <input
                  type="text"
                  value={newReward.icon}
                  onChange={(e) => setNewReward({ ...newReward, icon: e.target.value })}
                  placeholder="🎁"
                  className="w-20 bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-white/50"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddReward(false)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReward}
                  className="flex-1 bg-blue-500/30 hover:bg-blue-500/40 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Add Reward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
