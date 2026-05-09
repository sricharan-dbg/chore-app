import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListTodo, CalendarDays, Users, ArrowLeft, CheckSquare,
  LogOut, Share2, ChevronDown, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'
import ShareModal from './ShareModal'

const NAV = [
  { id: 'tasks',    label: 'Tasks',    icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'team',     label: 'Team',     icon: Users },
]

export default function Sidebar({ tab, setTab, stats, workspace, isOwner }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [showShare, setShowShare] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <>
      <aside className="w-[210px] flex-shrink-0 flex flex-col h-full"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Top */}
        <div className="px-3 pt-4 pb-3">
          {/* Back to dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-[12px] text-[#444444] hover:text-[#888888] transition-colors mb-5"
          >
            <ArrowLeft size={12} />
            <span>All workspaces</span>
          </button>

          {/* Workspace name */}
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold text-[#10b981] flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              {workspace?.name?.[0]?.toUpperCase() || 'W'}
            </div>
            <span className="text-[13px] font-semibold text-white truncate">{workspace?.name || 'Workspace'}</span>
          </div>
        </div>

        <div className="divider" />

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`nav-link w-full ${active ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {id === 'tasks' && stats.overdue > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                    {stats.overdue}
                  </span>
                )}
                {id === 'tasks' && stats.pending > 0 && stats.overdue === 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    {stats.pending}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Stats summary */}
        {stats.total > 0 && (
          <div className="px-3 py-3">
            <div className="rounded-lg p-3" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between text-[11px] text-[#444444] mb-2">
                <span>Progress</span>
                <span>{stats.total ? Math.round(stats.completed / stats.total * 100) : 0}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#10b981' }}
                  initial={{ width: 0 }}
                  animate={{ width: stats.total ? `${stats.completed / stats.total * 100}%` : '0%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              {stats.overdue > 0 && (
                <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-red-400">
                  <AlertCircle size={10} />
                  <span>{stats.overdue} overdue</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Share button */}
        <div className="px-2 py-2">
          <button
            onClick={() => setShowShare(true)}
            className="nav-link w-full text-[#555555] hover:text-[#888888]"
          >
            <Share2 size={14} />
            <span>Share workspace</span>
          </button>
        </div>

        <div className="divider" />

        {/* User profile */}
        <div className="px-2 py-2 relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="nav-link w-full"
          >
            <Avatar name={profile?.name || ''} size={24} />
            <span className="flex-1 text-[#888888] truncate text-[12.5px]">
              {profile?.name || 'Account'}
            </span>
            <ChevronDown size={13} className="text-[#444444]" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-12 left-2 right-2 rounded-lg overflow-hidden"
                style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)', zIndex: 50 }}
              >
                <div className="px-3 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="text-[12px] font-medium text-white">{profile?.name}</div>
                  <div className="text-[11px] text-[#555555] truncate">{profile?.id?.slice(0, 8)}...</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] text-[#ef4444] hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <AnimatePresence>
        {showShare && workspace && (
          <ShareModal workspace={workspace} onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
