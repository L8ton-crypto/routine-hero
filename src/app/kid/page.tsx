'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, RotateCcw, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Task {
  id: number
  name: string
  icon: string
  duration: number
  points: number
  sort_order: number
  completed?: boolean
}

interface Routine {
  id: number
  name: string
  type: string
  tasks: Task[]
}

interface Child {
  id: number
  name: string
  avatar: string
  xp: number
  level: number
  streak: number
}

function Timer({ duration, isRunning, onComplete }: {
  duration: number
  isRunning: boolean
  onComplete: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(duration * 60)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isRunning, timeLeft, onComplete])

  useEffect(() => {
    setTimeLeft(duration * 60)
  }, [duration])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/20" />
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="transparent"
          strokeDasharray={`${progress * 2.827} 283`} className="text-green-400 transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-2xl font-bold">{minutes}:{seconds.toString().padStart(2, '0')}</div>
          <div className="text-sm opacity-70">left</div>
        </div>
      </div>
    </div>
  )
}

export default function KidDashboard() {
  const [familyId, setFamilyId] = useState<number | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('rh_family')
    if (stored) {
      const fam = JSON.parse(stored)
      setFamilyId(fam.id)
    }
    const storedChild = localStorage.getItem('rh_child_id')
    if (storedChild) {
      // Will be matched after children load
    }
  }, [])

  // Load children
  useEffect(() => {
    if (!familyId) return
    fetch(`/api/children?familyId=${familyId}`)
      .then(r => r.json())
      .then(data => {
        setChildren(data.children || [])
        // Auto-select if stored
        const storedId = localStorage.getItem('rh_child_id')
        if (storedId) {
          const found = (data.children || []).find((c: Child) => c.id === parseInt(storedId))
          if (found) setSelectedChild(found)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [familyId])

  // Load routines for selected child
  const loadRoutines = useCallback(async () => {
    if (!familyId || !selectedChild) return
    try {
      const res = await fetch(`/api/routines?familyId=${familyId}&childId=${selectedChild.id}`)
      const data = await res.json()
      setRoutines(data.routines || [])
    } catch (e) {
      console.error('Failed to load routines:', e)
    }
  }, [familyId, selectedChild])

  useEffect(() => {
    loadRoutines()
  }, [loadRoutines])

  const selectChild = (child: Child) => {
    setSelectedChild(child)
    localStorage.setItem('rh_child_id', String(child.id))
  }

  const startRoutine = (routine: Routine) => {
    // Reset completed state on tasks
    const resetTasks = routine.tasks.map(t => ({ ...t, completed: false }))
    setActiveRoutine({ ...routine, tasks: resetTasks })
    setCurrentTaskIndex(0)
    setIsTimerRunning(false)
  }

  const completeTask = async () => {
    if (!activeRoutine || !selectedChild) return
    const task = activeRoutine.tasks[currentTaskIndex]
    if (!task || task.completed) return

    // Mark task completed locally
    const updatedTasks = [...activeRoutine.tasks]
    updatedTasks[currentTaskIndex] = { ...task, completed: true }
    setActiveRoutine({ ...activeRoutine, tasks: updatedTasks })

    // Show celebration
    setCelebrationText(`+${task.points} XP`)
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)

    // Check if routine is done
    if (currentTaskIndex >= activeRoutine.tasks.length - 1) {
      // Routine complete! Record to DB
      try {
        const res = await fetch('/api/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId: selectedChild.id, routineId: activeRoutine.id })
        })
        const data = await res.json()
        if (data.ok && data.child) {
          setSelectedChild(data.child)
          if (data.levelUp) {
            setTimeout(() => {
              setCelebrationText(`🎉 LEVEL UP! Level ${data.child.level}!`)
              setShowCelebration(true)
              setTimeout(() => setShowCelebration(false), 3000)
            }, 2500)
          }
        }
      } catch (e) {
        console.error('Failed to record completion:', e)
      }

      setTimeout(() => {
        setActiveRoutine(null)
        setCurrentTaskIndex(0)
        loadRoutines()
      }, 3000)
    } else {
      // Next task
      setTimeout(() => {
        setCurrentTaskIndex(prev => prev + 1)
        setIsTimerRunning(false)
      }, 2000)
    }
  }

  const currentTask = activeRoutine?.tasks[currentTaskIndex]
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Child selection screen
  if (!selectedChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/" className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all">
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-white">Who&apos;s Playing?</h1>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/70 text-lg mb-4">No heroes yet! Ask a parent to add you.</p>
              <Link href="/" className="text-white/50 hover:text-white/80 transition-colors">
                ← Back to home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => selectChild(child)}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-3xl p-8 text-center transition-all hover:scale-105"
                >
                  <div className="text-6xl mb-4">{child.avatar}</div>
                  <div className="text-xl font-bold text-white mb-1">{child.name}</div>
                  <div className="text-white/60 text-sm">Level {child.level} • {child.streak}🔥</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Active routine view
  if (activeRoutine && currentTask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => { setActiveRoutine(null); setCurrentTaskIndex(0) }}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">{activeRoutine.name}</h1>
            <div className="text-white text-lg">{currentTaskIndex + 1} / {activeRoutine.tasks.length}</div>
          </div>

          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTask.id}
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center mb-8"
              >
                <div className="text-8xl mb-6">{currentTask.icon}</div>
                <h2 className="text-4xl font-bold text-white mb-4">{currentTask.name}</h2>
                <p className="text-white/80 text-xl mb-8">
                  Let&apos;s spend {currentTask.duration} minutes on this!
                </p>

                <div className="flex justify-center mb-8">
                  <Timer duration={currentTask.duration} isRunning={isTimerRunning} onComplete={completeTask} />
                </div>

                <div className="flex justify-center space-x-4">
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 px-8 py-4 rounded-2xl text-white font-bold text-xl transition-all transform hover:scale-105">
                    {isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
                  </button>
                  <button onClick={completeTask}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-2xl text-white font-bold text-xl transition-all transform hover:scale-105">
                    <Trophy className="w-6 h-6" />
                    <span>Done!</span>
                  </button>
                  <button onClick={() => setIsTimerRunning(false)}
                    className="flex items-center bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl text-white font-bold transition-all">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-6 text-white/70">
                  Earn {currentTask.points} XP when you complete this task!
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress */}
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-semibold">Routine Progress</span>
                <span className="text-white/70">
                  {Math.round(((currentTaskIndex + (currentTask.completed ? 1 : 0)) / activeRoutine.tasks.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <motion.div className="bg-gradient-to-r from-green-400 to-blue-500 h-full"
                  style={{ width: `${((currentTaskIndex + (currentTask.completed ? 1 : 0)) / activeRoutine.tasks.length) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-4">
                {activeRoutine.tasks.map((task, index) => (
                  <div key={task.id} className={`text-center ${index <= currentTaskIndex ? 'text-white' : 'text-white/30'}`}>
                    <div className="text-2xl mb-1">{task.icon}</div>
                    {task.completed && <div className="text-green-400 text-xs">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Celebration */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }} className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: 2 }} className="text-8xl mb-4">🎉</motion.div>
                  <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="text-4xl font-bold text-white drop-shadow-lg">Great Job!</motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-2xl text-yellow-300 drop-shadow-lg">{celebrationText}</motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Main kid dashboard
  const xpProgress = selectedChild.xp % 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => { setSelectedChild(null); localStorage.removeItem('rh_child_id') }}
            className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {getGreeting()}, {selectedChild.name}! {selectedChild.avatar}
          </h1>
          <div className="text-white/80">Level {selectedChild.level}</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-white">{selectedChild.level}</div>
            <div className="text-white/70 text-sm">Level</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-white">{selectedChild.streak}</div>
            <div className="text-white/70 text-sm">Day Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-white">{Math.floor(selectedChild.xp / 10)}</div>
            <div className="text-white/70 text-sm">Stars</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold">Level {selectedChild.level} Progress</span>
            <span className="text-white/70">{xpProgress} / 100 XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-6 overflow-hidden">
            <motion.div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-1000"
              style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="text-center mt-2 text-white/70 text-sm">
            {100 - xpProgress} XP to reach Level {selectedChild.level + 1}!
          </div>
        </div>

        {/* Routines */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Choose Your Adventure!</h2>
          {routines.length === 0 ? (
            <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-2xl">
              <p className="text-white/70 text-lg">No routines assigned yet.</p>
              <p className="text-white/50 text-sm mt-2">Ask a parent to create routines for you!</p>
            </div>
          ) : (
            routines.map((routine) => (
              <motion.button key={routine.id} onClick={() => startRoutine(routine)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left hover:bg-white/20 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">
                      {routine.type === 'morning' ? '🌅' : routine.type === 'afterschool' ? '🏠' : '🌙'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{routine.name}</h3>
                      <div className="flex items-center space-x-4 text-white/70">
                        <span>{routine.tasks.length} tasks</span>
                        <span>{routine.tasks.reduce((s, t) => s + t.duration, 0)} min</span>
                        <span>{routine.tasks.reduce((s, t) => s + t.points, 0)} XP</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white" />
                    <span className="text-white font-semibold">Start!</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  {routine.tasks.slice(0, 6).map((task) => (
                    <span key={task.id} className="text-xl">{task.icon}</span>
                  ))}
                  {routine.tasks.length > 6 && <span className="text-white/50">+{routine.tasks.length - 6}</span>}
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
