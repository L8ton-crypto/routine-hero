'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, RotateCcw, Star, Zap, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Task {
  id: string
  name: string
  icon: string
  duration: number
  points: number
  completed: boolean
}

interface Routine {
  id: string
  name: string
  type: 'morning' | 'afterschool' | 'bedtime'
  tasks: Task[]
}

interface Child {
  id: string
  name: string
  avatar: string
  xp: number
  level: number
  streak: number
}

// Mock data
const mockChild: Child = {
  id: '1',
  name: 'Emma',
  avatar: '👧',
  xp: 150,
  level: 3,
  streak: 5
}

const mockRoutines: Routine[] = [
  {
    id: '1',
    name: 'Morning Routine',
    type: 'morning',
    tasks: [
      { id: '1', name: 'Brush Teeth', icon: '🪥', duration: 3, points: 10, completed: false },
      { id: '2', name: 'Get Dressed', icon: '👕', duration: 5, points: 15, completed: false },
      { id: '3', name: 'Eat Breakfast', icon: '🥞', duration: 15, points: 20, completed: false }
    ]
  },
  {
    id: '2',
    name: 'Bedtime Routine',
    type: 'bedtime',
    tasks: [
      { id: '4', name: 'Bath Time', icon: '🛁', duration: 20, points: 30, completed: false },
      { id: '5', name: 'Put on Pajamas', icon: '👕', duration: 3, points: 10, completed: false },
      { id: '6', name: 'Story Time', icon: '📖', duration: 15, points: 20, completed: false }
    ]
  }
]

interface TimerProps {
  duration: number
  isRunning: boolean
  onComplete: () => void
  onReset: () => void
}

function Timer({ duration, isRunning, onComplete, onReset }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60) // Convert to seconds
  
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
    <div className="relative">
      {/* Circular Progress */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-white/20"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${progress * 2.827} 283`}
            className="text-green-400 transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-2xl font-bold">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm opacity-70">left</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KidDashboard() {
  const [child] = useState<Child>(mockChild)
  const [routines] = useState<Routine[]>(mockRoutines)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [earnedXP, setEarnedXP] = useState(0)

  const currentTask = activeRoutine?.tasks[currentTaskIndex]

  const startRoutine = (routine: Routine) => {
    setActiveRoutine(routine)
    setCurrentTaskIndex(0)
    setIsTimerRunning(false)
  }

  const completeTask = () => {
    if (!activeRoutine || !currentTask) return

    // Mark task as completed
    currentTask.completed = true
    setEarnedXP(prev => prev + currentTask.points)
    
    // Show celebration
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)

    // Move to next task or complete routine
    if (currentTaskIndex < activeRoutine.tasks.length - 1) {
      setTimeout(() => {
        setCurrentTaskIndex(prev => prev + 1)
        setIsTimerRunning(false)
      }, 2000)
    } else {
      // Routine completed
      setTimeout(() => {
        setActiveRoutine(null)
        setCurrentTaskIndex(0)
      }, 3000)
    }
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
  }

  const getXPProgress = () => child.xp % 100
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (activeRoutine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setActiveRoutine(null)}
              className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">{activeRoutine.name}</h1>
            <div className="text-white text-lg">
              {currentTaskIndex + 1} / {activeRoutine.tasks.length}
            </div>
          </div>

          {/* Current Task */}
          {currentTask && (
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
                    Let's spend {currentTask.duration} minutes on this task!
                  </p>

                  {/* Timer */}
                  <div className="flex justify-center mb-8">
                    <Timer
                      duration={currentTask.duration}
                      isRunning={isTimerRunning}
                      onComplete={completeTask}
                      onReset={resetTimer}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 px-8 py-4 rounded-2xl text-white font-bold text-xl transition-all transform hover:scale-105"
                    >
                      {isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
                    </button>
                    
                    <button
                      onClick={completeTask}
                      className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-2xl text-white font-bold text-xl transition-all transform hover:scale-105"
                    >
                      <Trophy className="w-6 h-6" />
                      <span>Done!</span>
                    </button>

                    <button
                      onClick={resetTimer}
                      className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 px-6 py-4 rounded-2xl text-white font-bold transition-all"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-6 text-white/70">
                    Earn {currentTask.points} XP when you complete this task!
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress Bar */}
              <div className="bg-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-semibold">Routine Progress</span>
                  <span className="text-white/70">{Math.round(((currentTaskIndex + (currentTask.completed ? 1 : 0)) / activeRoutine.tasks.length) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-500"
                    style={{ width: `${((currentTaskIndex + (currentTask.completed ? 1 : 0)) / activeRoutine.tasks.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-4">
                  {activeRoutine.tasks.map((task, index) => (
                    <div 
                      key={task.id} 
                      className={`text-center ${
                        index <= currentTaskIndex ? 'text-white' : 'text-white/30'
                      }`}
                    >
                      <div className={`text-2xl mb-1 ${task.completed ? 'filter saturate-200' : ''}`}>
                        {task.icon}
                      </div>
                      {task.completed && <div className="text-green-400 text-xs">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Celebration Animation */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: 2 }}
                    className="text-8xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    className="text-4xl font-bold text-white drop-shadow-lg"
                  >
                    Great Job!
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl text-yellow-300 drop-shadow-lg"
                  >
                    +{currentTask?.points} XP
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all">
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {getGreeting()}, {child.name}! {child.avatar}
          </h1>
          <div className="text-white/80">
            Level {child.level}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-white">{child.level}</div>
            <div className="text-white/70 text-sm">Level</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-white">{child.streak}</div>
            <div className="text-white/70 text-sm">Day Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-white">{Math.floor(child.xp / 10)}</div>
            <div className="text-white/70 text-sm">Stars</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold">Level {child.level} Progress</span>
            <span className="text-white/70">{getXPProgress()} / 100 XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-6 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-1000"
              style={{ width: `${getXPProgress()}%` }}
            />
          </div>
          <div className="text-center mt-2 text-white/70 text-sm">
            {100 - getXPProgress()} XP to reach Level {child.level + 1}!
          </div>
        </div>

        {/* Available Routines */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Choose Your Adventure!</h2>
          {routines.map((routine) => (
            <motion.button
              key={routine.id}
              onClick={() => startRoutine(routine)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left hover:bg-white/20 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {routine.type === 'morning' ? '🌅' : 
                     routine.type === 'afterschool' ? '🏠' : '🌙'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{routine.name}</h3>
                    <div className="flex items-center space-x-4 text-white/70">
                      <span>{routine.tasks.length} tasks</span>
                      <span>{routine.tasks.reduce((sum, task) => sum + task.duration, 0)} minutes</span>
                      <span>{routine.tasks.reduce((sum, task) => sum + task.points, 0)} XP</span>
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
                {routine.tasks.length > 6 && (
                  <span className="text-white/50">+{routine.tasks.length - 6}</span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}