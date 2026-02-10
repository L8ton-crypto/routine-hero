'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Clock, Users, Target } from 'lucide-react'
import RoutineBuilder from '@/components/RoutineBuilder'
import ChildrenManager from '@/components/ChildrenManager'

interface Child {
  id: string
  name: string
  age: number
  xp: number
  level: number
  streak: number
  avatar: string
}

interface Routine {
  id: string
  name: string
  type: 'morning' | 'afterschool' | 'bedtime'
  tasks: Task[]
  assignedChildren: string[]
}

interface Task {
  id: string
  name: string
  icon: string
  duration: number
  points: number
}

const mockChildren: Child[] = [
  { id: '1', name: 'Emma', age: 6, xp: 150, level: 3, streak: 5, avatar: '👧' },
  { id: '2', name: 'Oliver', age: 9, xp: 320, level: 6, streak: 12, avatar: '👦' }
]

const mockRoutines: Routine[] = [
  {
    id: '1',
    name: 'Morning Routine',
    type: 'morning',
    tasks: [
      { id: '1', name: 'Brush Teeth', icon: '🪥', duration: 3, points: 10 },
      { id: '2', name: 'Get Dressed', icon: '👕', duration: 5, points: 15 },
      { id: '3', name: 'Eat Breakfast', icon: '🥞', duration: 15, points: 20 }
    ],
    assignedChildren: ['1', '2']
  }
]

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'children' | 'builder'>('overview')
  const [children, setChildren] = useState<Child[]>(mockChildren)
  const [routines, setRoutines] = useState<Routine[]>(mockRoutines)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)

  const getTotalXP = () => children.reduce((sum, child) => sum + child.xp, 0)
  const getAverageLevel = () => Math.round(children.reduce((sum, child) => sum + child.level, 0) / children.length)
  const getLongestStreak = () => Math.max(...children.map(child => child.streak))

  const handleNewRoutine = () => {
    setEditingRoutine({
      id: Date.now().toString(),
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

  const handleSaveRoutine = (routine: Routine) => {
    if (routines.find(r => r.id === routine.id)) {
      setRoutines(routines.map(r => r.id === routine.id ? routine : r))
    } else {
      setRoutines([...routines, routine])
    }
    setEditingRoutine(null)
    setActiveTab('routines')
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
            Managing {children.length} {children.length === 1 ? 'child' : 'children'}
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
              onClick={() => setActiveTab(tab.id as any)}
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
                  <div className="text-3xl font-bold">{getTotalXP()}</div>
                  <div className="opacity-90">Total XP Earned</div>
                </div>
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                  <div className="text-3xl font-bold">{getAverageLevel()}</div>
                  <div className="opacity-90">Average Level</div>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl p-6 text-white">
                  <div className="text-3xl font-bold">{getLongestStreak()}</div>
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
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-white/80">
                      <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm">✓</span>
                      <span>Emma completed Morning Routine</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white/80">
                      <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">🎯</span>
                      <span>Oliver earned Level 6!</span>
                    </div>
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
              <div className="grid gap-6">
                {routines.map((routine) => (
                  <div key={routine.id} className="bg-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{routine.name}</h3>
                      <button
                        onClick={() => handleEditRoutine(routine)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white font-semibold transition-all"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {routine.tasks.map((task) => (
                        <span key={task.id} className="bg-white/20 px-3 py-1 rounded-full text-white text-sm">
                          {task.icon} {task.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-white/70 text-sm">
                      Assigned to: {routine.assignedChildren.map(id => 
                        children.find(c => c.id === id)?.name
                      ).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'children' && (
            <ChildrenManager children={children} onChildrenChange={setChildren} />
          )}

          {activeTab === 'builder' && editingRoutine && (
            <RoutineBuilder
              routine={editingRoutine}
              children={children}
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