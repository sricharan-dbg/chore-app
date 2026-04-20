import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Trash2, Mail, User, ChevronRight } from 'lucide-react'
import { getAvatarColor } from '../lib/colors'
import Avatar from './Avatar'
import toast from 'react-hot-toast'

export default function TeamPanel({ members, chores, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: '' })
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await onAdd({ name: form.name.trim(), email: form.email.trim(), role: form.role.trim() })
    setSaving(false)
    if (error) { toast.error('Failed to add member'); return }
    toast.success(`${form.name} added to the team!`)
    setForm({ name: '', email: '', role: '' })
    setShowForm(false)
  }

  const handleRemove = async (m) => {
    if (!confirm(`Remove ${m.name} from the team?`)) return
    await onRemove(m.id)
    toast.success(`${m.name} removed`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team Members</h2>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-neon px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
          onClick={() => setShowForm(v => !v)}>
          <UserPlus size={15} /> Add Member
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleAdd}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="glass rounded-2xl p-5 space-y-3 overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-300">New Team Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Name *</label>
                <input className="input-glass" placeholder="Jane Doe" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Role</label>
                <input className="input-glass" placeholder="e.g. Designer" value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Email</label>
                <input type="email" className="input-glass" placeholder="jane@company.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn-ghost px-4 py-2 text-sm font-semibold flex-1"
                onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-neon px-4 py-2 text-sm font-semibold flex-1">
                {saving ? '...' : 'Add Member'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Members list */}
      {members.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-slate-400 font-semibold">No team members yet</p>
          <p className="text-slate-600 text-sm mt-1">Add your first team member to start assigning chores</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {members.map((m, i) => {
              const ac = getAvatarColor(m.name)
              const assignedCount = chores.filter(c =>
                (c.chore_assignments || []).some(a => a.member_id === m.id)
              ).length
              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}
                  className="glass glass-hover rounded-2xl p-4 flex items-center gap-4">
                  <Avatar name={m.name} size={46} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{m.name}</span>
                      {m.role && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${ac}22`, color: ac, border: `1px solid ${ac}44` }}>
                          {m.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {m.email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} />{m.email}</span>}
                      <span className="text-xs text-slate-600">{assignedCount} chore{assignedCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button className="btn-ghost p-2 text-red-400/60 hover:text-red-400 border-red-400/10 hover:border-red-400/30 hover:bg-red-400/10"
                    onClick={() => handleRemove(m)} title="Remove member">
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
