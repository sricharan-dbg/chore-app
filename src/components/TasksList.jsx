import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckCircle2, Circle, RefreshCw, AlertTriangle,
  Calendar, ChevronDown, ChevronRight,
} from 'lucide-react'
import { format, isBefore, parseISO, startOfDay, isToday, isTomorrow } from 'date-fns'
import { TASK_COLORS } from '../lib/colors'
import Avatar from './Avatar'

const FILTERS = ['All', 'Today', 'Upcoming', 'Overdue', 'Completed']

const PRIORITY_DOT = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
}

export default function TasksList({ tasks, onTaskClick, onAdd, onToggle }) {
  const [filter, setFilter] = useState('All')
  const today = startOfDay(new Date())

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const due = t.due_date ? parseISO(t.due_date) : null
      switch (filter) {
        case 'Today': return due && isToday(due)
        case 'Upcoming': return due && !isBefore(due, today) && !t.completed
        case 'Overdue': return due && isBefore(due, today) && !t.completed
        case 'Completed': return t.completed
        default: return true
      }
    })
  }, [tasks, filter, today])

  const grouped = useMemo(() => {
    const groups = { Overdue: [], Today: [], Tomorrow: [], Upcoming: [], Completed: [] }
    for (const t of filtered) {
      if (t.completed) { groups.Completed.push(t); continue }
      const due = t.due_date ? parseISO(t.due_date) : null
      if (!due) { groups.Upcoming.push(t); continue }
      if (isBefore(due, today)) groups.Overdue.push(t)
      else if (isToday(due)) groups.Today.push(t)
      else if (isTomorrow(due)) groups.Tomorrow.push(t)
      else groups.Upcoming.push(t)
    }
    return groups
  }, [filtered, today])

  const pendingCount = tasks.filter(t => !t.completed).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-white">Tasks</h2>
          <p className="text-[12.5px] text-[#555555] mt-0.5">
            {tasks.length} total · {pendingCount} pending
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <Plus size={14} /> New task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: '#161616' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all flex-1"
            style={{
              background: filter === f ? '#1c1c1c' : 'transparent',
              color: filter === f ? '#eeeeee' : '#555555',
              border: filter === f ? '1px solid rgba(255,255,255,0.09)' : '1px solid transparent',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task groups */}
      <div className="flex-1 overflow-y-auto space-y-5">
        {filtered.length === 0 ? (
          <EmptyTasks filter={filter} onAdd={onAdd} />
        ) : (
          Object.entries(grouped).map(([group, items]) => {
            if (!items.length) return null
            return (
              <TaskGroup
                key={group}
                group={group}
                items={items}
                onTaskClick={onTaskClick}
                onToggle={onToggle}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

function TaskGroup({ group, items, onTaskClick, onToggle }) {
  const [collapsed, setCollapsed] = useState(false)

  const groupColor = {
    Overdue: '#ef4444',
    Today: '#f59e0b',
    Tomorrow: '#eeeeee',
    Upcoming: '#888888',
    Completed: '#10b981',
  }[group] || '#888888'

  return (
    <div>
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 mb-2 w-full text-left"
      >
        {collapsed
          ? <ChevronRight size={13} style={{ color: groupColor }} />
          : <ChevronDown size={13} style={{ color: groupColor }} />}
        <span className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: groupColor }}>
          {group}
        </span>
        <span className="text-[11px] text-[#444444] font-medium ml-1">{items.length}</span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
            className="space-y-1.5"
          >
            {items.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={i}
                onEdit={() => onTaskClick(task)}
                onToggle={() => onToggle(task.id, !task.completed)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TaskRow({ task, index, onEdit, onToggle }) {
  const col = TASK_COLORS[task.color_index] || TASK_COLORS[0]
  const today = startOfDay(new Date())
  const due = task.due_date ? parseISO(task.due_date) : null
  const overdue = due && isBefore(due, today) && !task.completed
  const assignees = (task.task_assignees || [])
    .map(a => a.profiles)
    .filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeftWidth: 2,
        borderLeftColor: overdue ? '#ef4444' : col.border,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#151515'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'
        e.currentTarget.style.borderLeftColor = overdue ? '#ef4444' : col.border
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#111111'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.borderLeftColor = overdue ? '#ef4444' : col.border
      }}
    >
      {/* Complete toggle */}
      <button
        onClick={e => { e.stopPropagation(); onToggle() }}
        className="flex-shrink-0 transition-opacity"
        style={{ color: task.completed ? '#10b981' : '#444444' }}
      >
        {task.completed
          ? <CheckCircle2 size={17} />
          : <Circle size={17} className="group-hover:text-[#666666] transition-colors" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2 flex-wrap">
          {task.priority && task.priority !== 'medium' && (
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: PRIORITY_DOT[task.priority] }} />
          )}
          <span className={`text-[13.5px] font-medium truncate ${task.completed ? 'line-through text-[#444444]' : 'text-[#dddddd]'}`}>
            {task.title}
          </span>
          {overdue && (
            <span className="flex items-center gap-1 text-[11px] text-red-400 flex-shrink-0">
              <AlertTriangle size={10} /> Overdue
            </span>
          )}
          {task.recurrence_type !== 'none' && (
            <RefreshCw size={10} className="text-[#444444] flex-shrink-0" />
          )}
        </div>
        {due && (
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar size={10} className={overdue ? 'text-red-400' : 'text-[#444444]'} />
            <span className={`text-[11.5px] ${overdue ? 'text-red-400' : 'text-[#555555]'}`}>
              {format(due, 'MMM d')}
              {isToday(due) && ' · Today'}
            </span>
          </div>
        )}
      </div>

      {/* Assignees */}
      {assignees.length > 0 && (
        <div className="flex -space-x-1.5 flex-shrink-0">
          {assignees.slice(0, 3).map(m => (
            <Avatar key={m.id} name={m.name} size={22} />
          ))}
          {assignees.length > 3 && (
            <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] text-[#555555]"
              style={{ background: '#1c1c1c', border: '1.5px solid #111111' }}>
              +{assignees.length - 3}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function EmptyTasks({ filter, onAdd }) {
  const messages = {
    All: { title: 'No tasks yet', sub: 'Create your first task to get started.' },
    Today: { title: 'Nothing due today', sub: 'Enjoy your clear schedule.' },
    Upcoming: { title: 'All caught up', sub: 'No upcoming tasks. Well done.' },
    Overdue: { title: 'No overdue tasks', sub: "You're on top of things." },
    Completed: { title: 'No completed tasks', sub: 'Finish some tasks to see them here.' },
  }
  const { title, sub } = messages[filter] || messages.All

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <CheckCircle2 size={20} className="text-[#333333]" />
      </div>
      <h3 className="text-[14px] font-semibold text-[#555555] mb-1.5">{title}</h3>
      <p className="text-[12.5px] text-[#3a3a3a] mb-5">{sub}</p>
      {filter === 'All' && (
        <button className="btn btn-secondary text-[12.5px]" onClick={onAdd}>
          <Plus size={13} /> New task
        </button>
      )}
    </div>
  )
}
