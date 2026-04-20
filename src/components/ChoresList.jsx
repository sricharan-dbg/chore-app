import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, Circle, RefreshCw, AlertCircle, Calendar, Filter } from 'lucide-react'
import { format, isBefore, parseISO, startOfDay, isToday, isTomorrow } from 'date-fns'
import { CHORE_COLORS } from '../lib/colors'
import Avatar from './Avatar'

const FILTERS = ['All', 'Due Today', 'Upcoming', 'Overdue', 'Completed']

export default function ChoresList({ chores, onChoreClick, onAdd, onToggle }) {
  const [filter, setFilter] = useState('All')

  const filtered = useMemo(() => {
    const today = startOfDay(new Date())
    return chores.filter(c => {
      const due = c.due_date ? parseISO(c.due_date) : null
      switch (filter) {
        case 'Due Today': return due && isToday(due)
        case 'Upcoming': return due && !isBefore(due, today) && !c.completed
        case 'Overdue': return due && isBefore(due, today) && !c.completed
        case 'Completed': return c.completed
        default: return true
      }
    })
  }, [chores, filter])

  const grouped = useMemo(() => {
    const today = startOfDay(new Date())
    const groups = { Overdue: [], 'Due Today': [], Tomorrow: [], 'This Week': [], Later: [], Completed: [] }
    for (const c of filtered) {
      if (c.completed) { groups.Completed.push(c); continue }
      const due = c.due_date ? parseISO(c.due_date) : null
      if (!due) { groups.Later.push(c); continue }
      if (isBefore(due, today)) groups.Overdue.push(c)
      else if (isToday(due)) groups['Due Today'].push(c)
      else if (isTomorrow(due)) groups.Tomorrow.push(c)
      else groups.Later.push(c)
    }
    return groups
  }, [filtered])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Chores</h2>
          <p className="text-sm text-slate-500 mt-0.5">{chores.length} total · {chores.filter(c => !c.completed).length} pending</p>
        </div>
        <button className="btn-neon px-4 py-2.5 text-sm font-semibold flex items-center gap-2" onClick={onAdd}>
          <Plus size={15} /> New Chore
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-slate-400 font-semibold">Nothing here!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, items]) => {
          if (!items.length) return null
          return (
            <div key={group}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${group === 'Overdue' ? 'text-red-400' : group === 'Due Today' ? 'text-yellow-400' : group === 'Completed' ? 'text-green-400' : 'text-slate-500'}`}>
                  {group}
                </span>
                <span className="text-xs text-slate-600 font-semibold">{items.length}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((c, i) => (
                    <ChoreRow key={c.id} chore={c} index={i} onEdit={() => onChoreClick(c)} onToggle={() => onToggle(c.id, !c.completed)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function ChoreRow({ chore, index, onEdit, onToggle }) {
  const col = CHORE_COLORS[chore.color_index] || CHORE_COLORS[0]
  const today = startOfDay(new Date())
  const due = chore.due_date ? parseISO(chore.due_date) : null
  const overdue = due && isBefore(due, today) && !chore.completed
  const assignees = (chore.chore_assignments || []).map(a => a.members).filter(Boolean)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.03 }}
      className="glass glass-hover rounded-xl p-3.5 flex items-center gap-3"
      style={{ borderLeft: `3px solid ${overdue ? '#ff6b6b' : col.border}` }}>
      {/* Complete toggle */}
      <button onClick={e => { e.stopPropagation(); onToggle() }}
        className="text-slate-600 hover:text-green-400 transition-colors flex-shrink-0">
        {chore.completed ? <CheckCircle2 size={20} className="text-green-400" /> : <Circle size={20} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-sm ${chore.completed ? 'line-through text-slate-500' : 'text-white'}`}>
            {chore.title}
          </span>
          {overdue && <span className="flex items-center gap-1 text-red-400 text-xs font-semibold"><AlertCircle size={11} />Overdue</span>}
          {chore.recurrence_type !== 'none' && (
            <span className="flex items-center gap-1 text-slate-500 text-xs"><RefreshCw size={10} />{chore.recurrence_type}</span>
          )}
        </div>
        {due && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <Calendar size={10} />
            {format(due, 'MMM d, yyyy')}
          </div>
        )}
      </div>

      {/* Assignees */}
      {assignees.length > 0 && (
        <div className="flex -space-x-1.5 flex-shrink-0">
          {assignees.slice(0, 3).map(m => <Avatar key={m.id} name={m.name} size={26} />)}
          {assignees.length > 3 && (
            <div className="w-[26px] h-[26px] rounded-full bg-slate-700 text-[9px] flex items-center justify-center text-slate-400 border border-slate-800">
              +{assignees.length - 3}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
