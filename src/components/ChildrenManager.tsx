'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Star, Zap } from 'lucide-react'

interface Child {
  id: string
  name: string
  age: number
  xp: number
  level: number
  streak: number
  avatar: string
}

interface Props {
  children: Child[]
  onChildrenChange: (children: Child[]) => void
}

const AVATAR_OPTIONS = ['👧', '👦', '🧒', '👶', '🦸‍♀️', '🦸‍♂️', '🤴', '👸', '🧙‍♀️', '🧙‍♂️', '🦄', '🐱', '🐶', '🐸', '🦊', '🐨']

export default function ChildrenManager({ children, onChildrenChange }: Props) {
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [isAddingChild, setIsAddingChild] = useState(false)

  const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1
  const getXPForNextLevel = (level: number) => level * 100
  const getXPProgress = (xp: number, level: number) => xp % 100

  const addChild = (child: Omit<Child, 'id' | 'xp' | 'level' | 'streak'>) => {
    const newChild: Child = {
      ...child,
      id: Date.now().toString(),
      xp: 0,
      level: 1,
      streak: 0
    }
    onChildrenChange([...children, newChild])
    setIsAddingChild(false)
  }

  const updateChild = (updatedChild: Child) => {
    onChildrenChange(children.map(child => child.id === updatedChild.id ? updatedChild : child))
    setEditingChild(null)
  }

  const deleteChild = (childId: string) => {
    if (confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      onChildrenChange(children.filter(child => child.id !== childId))
    }
  }

  const resetProgress = (childId: string) => {
    if (confirm('Are you sure you want to reset this child\'s progress?')) {
      const updatedChild = children.find(c => c.id === childId)
      if (updatedChild) {
        updateChild({ ...updatedChild, xp: 0, level: 1, streak: 0 })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Manage Children</h2>
        <button
          onClick={() => setIsAddingChild(true)}
          className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-white font-semibold transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Child</span>
        </button>
      </div>

      {/* Children Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <div key={child.id} className="bg-white/10 rounded-2xl p-6 space-y-4">
            {/* Child Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{child.avatar}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{child.name}</h3>
                  <p className="text-white/70">Age {child.age}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingChild(child)}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all"
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => deleteChild(child.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Level and XP */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Level {child.level}</span>
                <span className="text-white/70">{child.xp} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-500"
                  style={{ width: `${(getXPProgress(child.xp, child.level) / 100) * 100}%` }}
                />
              </div>
              <div className="text-center text-white/70 text-sm">
                {getXPProgress(child.xp, child.level)} / 100 XP to level {child.level + 1}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="text-xl font-bold text-white">{child.streak}</span>
                </div>
                <div className="text-white/70 text-sm">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-xl font-bold text-white">{Math.floor(child.xp / 10)}</span>
                </div>
                <div className="text-white/70 text-sm">Stars Earned</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => resetProgress(child.id)}
                className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-white py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Reset Progress
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Child Modal */}
      {(isAddingChild || editingChild) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border-2 border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingChild ? 'Edit Child' : 'Add New Child'}
            </h3>
            
            <ChildForm
              initialChild={editingChild}
              onSave={editingChild ? updateChild : addChild}
              onCancel={() => {
                setEditingChild(null)
                setIsAddingChild(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ChildForm({ 
  initialChild, 
  onSave, 
  onCancel 
}: { 
  initialChild?: Child | null
  onSave: (child: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: initialChild?.name || '',
    age: initialChild?.age || 5,
    avatar: initialChild?.avatar || AVATAR_OPTIONS[0]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      if (initialChild) {
        onSave({
          ...initialChild,
          ...formData
        })
      } else {
        onSave(formData)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-white/70 text-sm mb-2">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
          placeholder="Enter child's name"
          required
        />
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-2">Age</label>
        <select
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
          className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50"
        >
          {Array.from({ length: 15 }, (_, i) => i + 2).map(age => (
            <option key={age} value={age}>{age} years old</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-3">Choose Avatar</label>
        <div className="grid grid-cols-8 gap-2">
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setFormData({ ...formData, avatar })}
              className={`text-2xl p-3 rounded-xl border-2 transition-all ${
                formData.avatar === avatar
                  ? 'border-white bg-white/20'
                  : 'border-white/30 hover:border-white/50 hover:bg-white/10'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-white py-3 rounded-xl font-semibold transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-white py-3 rounded-xl font-semibold transition-all"
        >
          {initialChild ? 'Update' : 'Add'} Child
        </button>
      </div>
    </form>
  )
}