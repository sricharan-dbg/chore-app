import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay, parseISO,
  addMonths, subMonths, addWeeks, subWeeks, startOfWeek as soWeek, endOfWeek as eoWeek,
  addDays, subDays
} from 'date-fns'
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { CHORE_COLORS } from '../lib/colors'
import { getOccurrences } from '../lib/recurrence'
import Avatar from './Avatar'

const VIEWS = ['Month', 'Week', 'Day']

export default function CalendarView({ chores, onChoreClick, onDayClick }) {
  const [current, setCurrent] = useState(new Date())
  const [view, setView] = useState('Month')
  const [hover, setHover] = useState(null)

  const navigate = (dir) => {
    if (view === 'Month') setCurrent(dir > 0 ? addMonths(current, 1) : subMonths(current, 1))
    else if (view === 'Week') setCurrent(dir > 0 ? addWeeks(current, 1) : subWeeks(current, 1))
    else setCurrent(dir > 0 ? addDays(current, 1) : subDays(current, 1))
  }

  const rangeStart = useMemo(() => {
    if (view === 'Month') return startOfWeek(startOfMonth(current))
    if (view === 'Week') return soWeek(current)
    return startOfDay(current)
  }, [current, view])

  const rangeEnd = useMemo(() => {
    if (view === 'Month') return endOfWeek(endOfMonth(current))
    if (view === 'Week') return eoWeek(current)
    return current
  }, [current, view])

  const days = useMemo(() => eachDayOfInterval({ start: rangeStart, end: rangeEnd }), [rangeStart, rangeEnd])

  // Build a map: dateStr -> [chore occurrences]
  const choreMap = useMemo(() => {
    const map = {}
    for (const chore of chores) {
      if (!chore.due_date) continue
      const dates = getOccurrences(chore, rangeStart, rangeEnd)
      for (const d of dates) {
        if (!map[d]) map[d] = []
        map[d].push(chore)
      }
    }
    return map
  }, [chores, rangeStart, rangeEnd])

  const title = view === 'Month'
    ? format(current, 'MMMM yyyy')
    : view === 'Week'
    ? `${format(soWeek(current), 'MMM d')} – ${format(eoWeek(current), 'MMM d, yyyy')}`
    : format(current, 'EEEE, MMMM d yyyy')

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost p-2" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
          <motion.h2 key={title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="text-lg font-bold text-white min-w-[200px] text-center">{title}</motion.h2>
          <button className="btn-ghost p-2" onClick={() => navigate(1)}><ChevronRight size={18} /></button>
          <button className="btn-ghost px-3 py-1.5 text-xs font-semibold" onClick={() => setCurrent(new Date())}>Today</button>
        </div>
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          {VIEWS.map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === v ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-300'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      {(view === 'Month' || view === 'Week') && (
        <div className={`grid mb-2 ${view === 'Month' ? 'grid-cols-7' : 'grid-cols-7'}`}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">{d}</div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <motion.div key={title + view}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={view === 'Month' ? 'grid grid-cols-7 gap-1 flex-1' : view === 'Week' ? 'grid grid-cols-7 gap-1 flex-1' : 'flex-1'}
        >
          {view === 'Day' ? (
            <DayDetail day={current} chores={choreMap[format(current, 'yyyy-MM-dd')] || []} onChoreClick={onChoreClick} />
          ) : days.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const dayCh = choreMap[key] || []
            const otherMonth = !isSameMonth(day, current) && view === 'Month'
            const today = isToday(day)
            const maxShow = view === 'Week' ? 6 : 3
            const overflow = dayCh.length - maxShow

            return (
              <div key={key}
                className={`cal-cell flex flex-col ${otherMonth ? 'other-month' : ''} ${today ? 'today' : ''}`}
                style={{ minHeight: view === 'Week' ? 140 : 100 }}
                onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)}
                onClick={() => onDayClick && onDayClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                    ${today ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </span>
                  {dayCh.length > 0 && (
                    <span className="text-[10px] text-slate-600 font-medium">{dayCh.length}</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {dayCh.slice(0, maxShow).map(c => (
                    <ChorePill key={c.id} chore={c} onClick={e => { e.stopPropagation(); onChoreClick(c) }} />
                  ))}
                  {overflow > 0 && (
                    <div className="text-[10px] text-slate-500 font-semibold pl-1">+{overflow} more</div>
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

function ChorePill({ chore, onClick }) {
  const c = CHORE_COLORS[chore.color_index] || CHORE_COLORS[0]
  const overdue = !chore.completed && isBefore(parseISO(chore.due_date), startOfDay(new Date()))
  return (
    <div className="chore-pill" onClick={onClick}
      style={{ background: overdue ? 'rgba(255,60,60,0.18)' : c.bg, color: overdue ? '#ff6b6b' : c.text, borderLeft: `2px solid ${overdue ? '#ff6b6b' : c.border}` }}>
      <span className="flex items-center gap-1">
        {overdue && <AlertCircle size={9} />}
        {chore.completed && <CheckCircle2 size={9} />}
        {chore.recurrence_type !== 'none' && <RefreshCw size={9} />}
        {chore.title}
      </span>
    </div>
  )
}

function DayDetail({ day, chores, onChoreClick }) {
  return (
    <div className="glass rounded-2xl p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-4xl font-black ${isToday(day) ? 'neon-text' : 'text-white'}`}>{format(day, 'd')}</span>
        <div>
          <div className="text-white font-semibold">{format(day, 'EEEE')}</div>
          <div className="text-slate-500 text-sm">{format(day, 'MMMM yyyy')}</div>
        </div>
      </div>
      {chores.length === 0 ? (
        <div className="text-center text-slate-600 mt-12">
          <div className="text-4xl mb-2">✨</div>
          <div className="font-semibold">No chores today!</div>
        </div>
      ) : (
        <div className="space-y-2">
          {chores.map(c => {
            const col = CHORE_COLORS[c.color_index] || CHORE_COLORS[0]
            const overdue = !c.completed && isBefore(parseISO(c.due_date), startOfDay(new Date()))
            const assignees = (c.chore_assignments || []).map(a => a.members).filter(Boolean)
            return (
              <div key={c.id} onClick={() => onChoreClick(c)}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer glass-hover"
                style={{ borderLeft: `3px solid ${overdue ? '#ff6b6b' : col.border}`, background: overdue ? 'rgba(255,60,60,0.05)' : col.bg }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {overdue && <AlertCircle size={13} className="text-red-400 flex-shrink-0" />}
                    {c.completed && <CheckCircle2 size={13} style={{ color: col.text }} className="flex-shrink-0" />}
                    <span className={`font-semibold text-sm ${c.completed ? 'line-through opacity-50' : 'text-white'}`}>{c.title}</span>
                    {c.recurrence_type !== 'none' && <RefreshCw size={11} className="text-slate-500" />}
                  </div>
                  {c.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{c.description}</p>}
                </div>
                <div className="flex -space-x-1.5">
                  {assignees.slice(0, 3).map(m => <Avatar key={m.id} name={m.name} size={24} />)}
                  {assignees.length > 3 && <div className="w-6 h-6 rounded-full bg-slate-700 text-[10px] flex items-center justify-center text-slate-400">+{assignees.length - 3}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
