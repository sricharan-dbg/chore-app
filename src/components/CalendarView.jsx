import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, parseISO,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react'
import { TASK_COLORS } from '../lib/colors'
import { getOccurrences } from '../lib/recurrence'
import Avatar from './Avatar'

const VIEWS = ['Month', 'Week', 'Day']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ tasks, onTaskClick, onDayClick }) {
  const [current, setCurrent] = useState(new Date())
  const [view, setView] = useState('Month')

  const navigate = (dir) => {
    if (view === 'Month') setCurrent(v => dir > 0 ? addMonths(v, 1) : subMonths(v, 1))
    else if (view === 'Week') setCurrent(v => dir > 0 ? addWeeks(v, 1) : subWeeks(v, 1))
    else setCurrent(v => dir > 0 ? addDays(v, 1) : subDays(v, 1))
  }

  const rangeStart = useMemo(() => {
    if (view === 'Month') return startOfWeek(startOfMonth(current))
    if (view === 'Week') return startOfWeek(current)
    return startOfDay(current)
  }, [current, view])

  const rangeEnd = useMemo(() => {
    if (view === 'Month') return endOfWeek(endOfMonth(current))
    if (view === 'Week') return endOfWeek(current)
    return current
  }, [current, view])

  const days = useMemo(() => eachDayOfInterval({ start: rangeStart, end: rangeEnd }), [rangeStart, rangeEnd])

  const taskMap = useMemo(() => {
    const map = {}
    for (const task of tasks) {
      if (!task.due_date) continue
      const dates = getOccurrences(task, rangeStart, rangeEnd)
      for (const d of dates) {
        if (!map[d]) map[d] = []
        map[d].push(task)
      }
    }
    return map
  }, [tasks, rangeStart, rangeEnd])

  const title = view === 'Month'
    ? format(current, 'MMMM yyyy')
    : view === 'Week'
    ? `${format(startOfWeek(current), 'MMM d')} – ${format(endOfWeek(current), 'MMM d, yyyy')}`
    : format(current, 'EEEE, MMMM d')

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost p-1.5" onClick={() => navigate(-1)}>
            <ChevronLeft size={16} />
          </button>
          <AnimatePresence mode="wait">
            <motion.span
              key={title}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[15px] font-semibold text-white min-w-[180px] text-center"
            >
              {title}
            </motion.span>
          </AnimatePresence>
          <button className="btn btn-ghost p-1.5" onClick={() => navigate(1)}>
            <ChevronRight size={16} />
          </button>
          <button
            className="btn btn-ghost text-[12px] px-3 py-1.5 text-[#888888]"
            onClick={() => setCurrent(new Date())}
          >
            Today
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#161616' }}>
          {VIEWS.map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-md text-[12px] font-medium transition-all"
              style={{
                background: view === v ? '#1c1c1c' : 'transparent',
                color: view === v ? '#eeeeee' : '#555555',
                border: view === v ? '1px solid rgba(255,255,255,0.09)' : '1px solid transparent',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      {view !== 'Day' && (
        <div className="grid grid-cols-7 mb-1.5">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[11.5px] font-medium text-[#444444] py-1.5">
              {d}
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={title + view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={view === 'Month' ? 'grid grid-cols-7 gap-1 flex-1' : view === 'Week' ? 'grid grid-cols-7 gap-1 flex-1' : 'flex-1'}
        >
          {view === 'Day' ? (
            <DayDetail day={current} dayTasks={taskMap[format(current, 'yyyy-MM-dd')] || []} onTaskClick={onTaskClick} />
          ) : days.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const dayTasks = taskMap[key] || []
            const otherMonth = !isSameMonth(day, current) && view === 'Month'
            const isCurrentDay = isToday(day)
            const maxShow = view === 'Week' ? 5 : 3
            const overflow = dayTasks.length - maxShow

            return (
              <div
                key={key}
                className={`cal-cell flex flex-col ${otherMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''}`}
                style={{ minHeight: view === 'Week' ? 120 : 90 }}
                onClick={() => onDayClick?.(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11.5px] font-semibold w-5 h-5 flex items-center justify-center rounded-full
                    ${isCurrentDay ? 'text-black' : 'text-[#666666]'}`}
                    style={isCurrentDay ? { background: '#10b981' } : {}}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-[#444444]">{dayTasks.length}</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  {dayTasks.slice(0, maxShow).map(t => (
                    <TaskPill key={t.id} task={t} onClick={e => { e.stopPropagation(); onTaskClick(t) }} />
                  ))}
                  {overflow > 0 && (
                    <div className="text-[10px] text-[#444444] pl-1 mt-0.5">+{overflow} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TaskPill({ task, onClick }) {
  const c = TASK_COLORS[task.color_index] || TASK_COLORS[0]
  const overdue = !task.completed && task.due_date && isBefore(parseISO(task.due_date), startOfDay(new Date()))

  return (
    <div
      className="task-pill"
      onClick={onClick}
      style={{
        background: overdue ? 'rgba(239,68,68,0.12)' : c.bg,
        color: overdue ? '#ef4444' : c.text,
        borderLeft: `2px solid ${overdue ? '#ef4444' : c.border}`,
      }}
    >
      <span className="flex items-center gap-1">
        {task.completed && <CheckCircle2 size={8} />}
        {overdue && <AlertTriangle size={8} />}
        {task.recurrence_type !== 'none' && <RefreshCw size={8} />}
        {task.title}
      </span>
    </div>
  )
}

function DayDetail({ day, dayTasks, onTaskClick }) {
  return (
    <div className="card p-6 h-full">
      <div className="flex items-baseline gap-3 mb-5">
        <span className={`text-4xl font-bold ${isToday(day) ? 'text-[#10b981]' : 'text-white'}`}>
          {format(day, 'd')}
        </span>
        <div>
          <div className="text-[14px] font-medium text-white">{format(day, 'EEEE')}</div>
          <div className="text-[12.5px] text-[#555555]">{format(day, 'MMMM yyyy')}</div>
        </div>
      </div>

      {dayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <CheckCircle2 size={18} className="text-[#333333]" />
          </div>
          <p className="text-[13px] text-[#444444]">No tasks this day</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayTasks.map(t => {
            const col = TASK_COLORS[t.color_index] || TASK_COLORS[0]
            const overdue = !t.completed && t.due_date && isBefore(parseISO(t.due_date), startOfDay(new Date()))
            const assignees = (t.task_assignees || []).map(a => a.profiles).filter(Boolean)

            return (
              <div
                key={t.id}
                onClick={() => onTaskClick(t)}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all"
                style={{
                  background: overdue ? 'rgba(239,68,68,0.06)' : col.bg,
                  borderLeft: `3px solid ${overdue ? '#ef4444' : col.border}`,
                  border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderLeftWidth: 3,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {t.completed && <CheckCircle2 size={13} style={{ color: col.text }} />}
                    {overdue && <AlertTriangle size={12} className="text-red-400" />}
                    <span className={`text-[13px] font-medium ${t.completed ? 'line-through text-[#444444]' : 'text-white'}`}>
                      {t.title}
                    </span>
                    {t.recurrence_type !== 'none' && <RefreshCw size={11} className="text-[#555555]" />}
                  </div>
                  {t.description && (
                    <p className="text-[11.5px] text-[#555555] mt-0.5 truncate">{t.description}</p>
                  )}
                </div>
                {assignees.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {assignees.slice(0, 3).map(m => <Avatar key={m.id} name={m.name} size={22} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
