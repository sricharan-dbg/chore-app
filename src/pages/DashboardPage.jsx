import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckSquare, LogOut, ChevronRight, Users, ListTodo, Loader2, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useWorkspaces } from '../hooks/useWorkspaces'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()
  const { workspaces, loading, createWorkspace } = useWorkspaces()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) return
    setCreating(true)
    const { data, error } = await createWorkspace({
      name: createForm.name.trim(),
      description: createForm.description.trim(),
    })
    setCreating(false)
    if (error) { toast.error('Failed to create workspace'); return }
    setShowCreate(false)
    setCreateForm({ name: '', description: '' })
    toast.success('Workspace created')
    navigate(`/workspace/${data.id}`)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#10b981' }}>
            <CheckSquare size={14} className="text-black" />
          </div>
          <span className="font-semibold text-[15px] text-white">ChoreOS</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={profile?.name || user?.email || ''} size={30} />
            <span className="text-[13px] text-[#888888] hidden sm:block">
              {profile?.name || user?.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn btn-ghost p-2"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold text-white">
              {greeting()}, {profile?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-[13.5px] text-[#555555] mt-1">
              {workspaces.length === 0
                ? 'Create your first workspace to get started'
                : `${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary"
          >
            <Plus size={14} /> New workspace
          </button>
        </div>

        {loading ? (
          <WorkspaceGrid loading />
        ) : workspaces.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <WorkspaceGrid workspaces={workspaces} onOpen={id => navigate(`/workspace/${id}`)} />
        )}
      </main>

      {/* Create workspace modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div
              className="modal-box p-6"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-semibold text-white">New workspace</h2>
                <button className="btn btn-ghost p-1.5" onClick={() => setShowCreate(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#888888] mb-1.5">
                    Workspace name
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Home Chores, Office Tasks..."
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#888888] mb-1.5">
                    Description <span className="text-[#444444]">(optional)</span>
                  </label>
                  <input
                    className="input"
                    placeholder="What's this workspace for?"
                    value={createForm.description}
                    onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button type="button" className="btn btn-ghost flex-1"
                    onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={creating}>
                    {creating ? <Loader2 size={14} className="animate-spin" /> : 'Create workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WorkspaceGrid({ workspaces = [], onOpen, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-5 h-32">
            <div className="skeleton h-4 w-32 mb-3" />
            <div className="skeleton h-3 w-48 mb-4" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {workspaces.map((ws, i) => (
        <motion.button
          key={ws.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onOpen(ws.id)}
          className="card card-hover p-5 text-left group w-full"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[15px] font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              {ws.name[0].toUpperCase()}
            </div>
            <ChevronRight size={15} className="text-[#333333] group-hover:text-[#666666] transition-colors mt-1" />
          </div>

          <h3 className="font-semibold text-[14px] text-white mb-1 truncate">{ws.name}</h3>
          {ws.description && (
            <p className="text-[12.5px] text-[#555555] mb-3 truncate">{ws.description}</p>
          )}

          <div className="flex items-center gap-3 mt-auto">
            <span className="flex items-center gap-1.5 text-[12px] text-[#555555]">
              <Users size={11} />
              {ws.workspace_members?.[0]?.count ?? 0} member{(ws.workspace_members?.[0]?.count ?? 0) !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#555555]">
              <ListTodo size={11} />
              {ws.tasks?.[0]?.count ?? 0} task{(ws.tasks?.[0]?.count ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <ListTodo size={22} className="text-[#10b981]" />
      </div>
      <h3 className="text-[16px] font-semibold text-white mb-2">No workspaces yet</h3>
      <p className="text-[13.5px] text-[#555555] mb-6 max-w-xs">
        Create a private workspace to start organizing tasks. Invite your team when you're ready.
      </p>
      <button className="btn btn-primary" onClick={onCreate}>
        <Plus size={14} /> Create workspace
      </button>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
