'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Save, X, Plus, Clock, Award } from 'lucide-react'

interface Task {
  id?: number
  name: string
  icon: string
  duration: number
  points: number
  sort_order?: number
  _tempId?: string
}

interface Routine {
  id: number | string
  name: string
  type: 'morning' | 'afterschool' | 'bedtime'
  tasks: Task[]
  assignedChildren: number[]
}

interface Child {
  id: number
  name: string
  age: number
  xp: number
  level: number
  streak: number
  avatar: string
}

interface Props {
  routine: Routine
  familyChildren: Child[]
  onSave: (routine: Routine) => void
  onCancel: () => void
}

const AVAILABLE_TASKS: Omit<Task, 'id'>[] = [
  { name: 'Brush Teeth', icon: '🪥', duration: 3, points: 10 },
  { name: 'Wash Face', icon: '🧼', duration: 2, points: 5 },
  { name: 'Get Dressed', icon: '👕', duration: 5, points: 15 },
  { name: 'Make Bed', icon: '🛏️', duration: 3, points: 10 },
  { name: 'Eat Breakfast', icon: '🥞', duration: 15, points: 20 },
  { name: 'Pack Backpack', icon: '🎒', duration: 5, points: 15 },
  { name: 'Put on Shoes', icon: '👟', duration: 2, points: 5 },
  { name: 'Homework', icon: '📚', duration: 30, points: 50 },
  { name: 'Tidy Room', icon: '🧹', duration: 10, points: 25 },
  { name: 'Bath Time', icon: '🛁', duration: 20, points: 30 },
  { name: 'Put on Pajamas', icon: '👕', duration: 3, points: 10 },
  { name: 'Story Time', icon: '📖', duration: 15, points: 20 },
  { name: 'Say Goodnight', icon: '😴', duration: 2, points: 10 }
]

function SortableTask({ task, onRemove }: {
  task: Task & { _tempId?: string }
  onRemove: (id: string) => void
}) {
  const sortId = task._tempId || String(task.id)
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: sortId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white/20 rounded-xl p-4 cursor-move hover:bg-white/30 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{task.icon}</span>
          <div>
            <div className="text-white font-semibold">{task.name}</div>
            <div className="text-white/60 text-sm flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" /><span>{task.duration}m</span>
              </span>
              <span className="flex items-center space-x-1">
                <Award className="w-3 h-3" /><span>{task.points}pt</span>
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => onRemove(sortId)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-all opacity-0 group-hover:opacity-100">
          Remove
        </button>
      </div>
    </div>
  )
}

export default function RoutineBuilder({ routine, familyChildren, onSave, onCancel }: Props) {
  const [currentRoutine, setCurrentRoutine] = useState<Routine & { tasks: (Task & { _tempId?: string })[] }>({
    ...routine,
    tasks: routine.tasks.map((t, i) => ({ ...t, _tempId: t._tempId || `task-${Date.now()}-${i}` }))
  })
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = currentRoutine.tasks.findIndex(t => (t._tempId || String(t.id)) === active.id)
      const newIndex = currentRoutine.tasks.findIndex(t => (t._tempId || String(t.id)) === over?.id)
      setCurrentRoutine({
        ...currentRoutine,
        tasks: arrayMove(currentRoutine.tasks, oldIndex, newIndex)
      })
    }
    setActiveId(null)
  }

  const addTask = (taskTemplate: Omit<Task, 'id'>) => {
    const newTask: Task & { _tempId: string } = {
      ...taskTemplate,
      _tempId: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    setCurrentRoutine({
      ...currentRoutine,
      tasks: [...currentRoutine.tasks, newTask]
    })
  }

  const removeTask = (sortId: string) => {
    setCurrentRoutine({
      ...currentRoutine,
      tasks: currentRoutine.tasks.filter(t => (t._tempId || String(t.id)) !== sortId)
    })
  }

  const toggleChildAssignment = (childId: number) => {
    const isAssigned = currentRoutine.assignedChildren.includes(childId)
    setCurrentRoutine({
      ...currentRoutine,
      assignedChildren: isAssigned
        ? currentRoutine.assignedChildren.filter(id => id !== childId)
        : [...currentRoutine.assignedChildren, childId]
    })
  }

  const getTotalTime = () => currentRoutine.tasks.reduce((sum, task) => sum + task.duration, 0)
  const getTotalPoints = () => currentRoutine.tasks.reduce((sum, task) => sum + task.points, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {routine.id === 'new' ? 'Create New Routine' : 'Edit Routine'}
        </h2>
        <div className="flex space-x-3">
          <button onClick={onCancel}
            className="flex items-center space-x-2 bg-gray-500/20 hover:bg-gray-500/30 px-6 py-3 rounded-xl text-white font-semibold transition-all">
            <X className="w-5 h-5" /><span>Cancel</span>
          </button>
          <button onClick={() => onSave(currentRoutine)}
            disabled={!currentRoutine.name || currentRoutine.tasks.length === 0}
            className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl text-white font-semibold transition-all">
            <Save className="w-5 h-5" /><span>Save Routine</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Routine Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Name</label>
                <input type="text" value={currentRoutine.name}
                  onChange={(e) => setCurrentRoutine({ ...currentRoutine, name: e.target.value })}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                  placeholder="Morning Routine" />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Type</label>
                <select value={currentRoutine.type}
                  onChange={(e) => setCurrentRoutine({ ...currentRoutine, type: e.target.value as 'morning' | 'afterschool' | 'bedtime' })}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50">
                  <option value="morning">Morning</option>
                  <option value="afterschool">After School</option>
                  <option value="bedtime">Bedtime</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assign children */}
          <div className="bg-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Assign to Children</h3>
            {familyChildren.length === 0 ? (
              <p className="text-white/50">Add children first from the Children tab.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {familyChildren.map((child) => (
                  <button key={child.id} onClick={() => toggleChildAssignment(child.id)}
                    className={`p-4 rounded-xl font-semibold transition-all ${
                      currentRoutine.assignedChildren.includes(child.id)
                        ? 'bg-green-500/30 border-2 border-green-400 text-white'
                        : 'bg-white/20 border-2 border-white/30 text-white/70 hover:bg-white/30'
                    }`}>
                    <div className="text-2xl mb-1">{child.avatar}</div>
                    <div className="text-sm">{child.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Routine Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{getTotalTime()}m</div>
                <div className="text-white/70 text-sm">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{getTotalPoints()}</div>
                <div className="text-white/70 text-sm">Total Points</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Available tasks */}
          <div className="bg-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Available Tasks</h3>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {AVAILABLE_TASKS.map((task, index) => (
                <button key={index} onClick={() => addTask(task)}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 p-3 rounded-xl text-left transition-all">
                  <span className="text-xl">{task.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{task.name}</div>
                    <div className="text-white/60 text-xs">{task.duration}m • {task.points}pt</div>
                  </div>
                  <Plus className="w-4 h-4 text-white/70" />
                </button>
              ))}
            </div>
          </div>

          {/* Current tasks */}
          <div className="bg-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Routine Tasks</h3>
            {currentRoutine.tasks.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No tasks yet. Add from above.
              </div>
            ) : (
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={currentRoutine.tasks.map(t => t._tempId || String(t.id))}
                  strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {currentRoutine.tasks.map((task) => (
                      <SortableTask key={task._tempId || task.id} task={task} onRemove={removeTask} />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeId ? <div className="bg-white/30 rounded-xl p-4 cursor-move" /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
