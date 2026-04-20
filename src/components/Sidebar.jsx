import { motion } from 'framer-motion'
import { CalendarDays, ListTodo, Users, Sparkles } from 'lucide-react'

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'chores',   label: 'Chores',   icon: ListTodo },
  { id: 'team',     label: 'Team',     icon: Users },
]

export default function Sidebar({ tab, setTab, stats }) {
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col gap-2">
      {/* Logo */}
      <div className="px-2 py-4 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #b44dff, #4d9fff)', boxShadow: '0 0 20px rgba(180,77,255,0.4)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="font-black text-white text-sm leading-tight">ChoreOS</div>
            <div className="text-[10px] text-slate-600 font-medium">Office Chores</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1 flex-1">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} className={`nav-item w-full ${active ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <Icon size={17} />
              <span>{t.label}</span>
              {t.id === 'chores' && stats.pending > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(180,77,255,0.2)', color: '#b44dff', border: '1px solid rgba(180,77,255,0.3)' }}>
                  {stats.pending}
                </span>
              )}
              {t.id === 'chores' && stats.overdue > 0 && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {stats.overdue}
                </span>
              )}
              {t.id === 'team' && stats.members > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(77,159,255,0.15)', color: '#4d9fff', border: '1px solid rgba(77,159,255,0.3)' }}>
                  {stats.members}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Stats */}
      <div className="glass rounded-2xl p-4 mt-4 space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overview</div>
        <StatRow label="Total Chores" value={stats.total} color="#b44dff" />
        <StatRow label="Completed" value={stats.completed} color="#00ff9f" />
        <StatRow label="Overdue" value={stats.overdue} color="#ff6b6b" />
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progress</span>
            <span>{stats.total ? Math.round(stats.completed / stats.total * 100) : 0}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #b44dff, #4d9fff)' }}
              initial={{ width: 0 }}
              animate={{ width: stats.total ? `${stats.completed / stats.total * 100}%` : '0%' }}
              transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
        </div>
      </div>
    </aside>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  )
}
