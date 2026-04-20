import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CHORE_COLORS, getAvatarColor, initials } from '../lib/colors'
import { RECURRENCE_TYPES, WEEKDAYS } from '../lib/recurrence'
import Avatar from './Avatar'

const EMPTY = {
  title: '', description: '', due_date: '', color_index: 0,
  recurrence_type: 'none', custom_days: [], assignees: [], completed: false,
}

export default function ChoreModal({ chore, members, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (chore) {
      const assigneeIds = (chore.chore_assignments || []).map(a => a.member_id)
      setForm({
        title: chore.title || '',
        description: chore.description || '',
        due_date: chore.due_date || '',
        color_index: chore.color_index ?? 0,
        recurrence_type: chore.recurrence_type || 'none',
        custom_days: chore.custom_days || [],
        assignees: assigneeIds,
        completed: chore.completed || false,
      })
    } else {
      setForm(EMPTY)
    }
  }, [chore])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleDay = (d) => {
    set('custom_days', form.custom_days.includes(d)
      ? form.custom_days.filter(x => x !== d)
      : [...form.custom_days, d])
  }

  const toggleAssignee = (id) => {
    set('assignees', form.assignees.includes(id)
      ? form.assignees.filter(x => x !== id)
      : [...form.assignees, id])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.due_date) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const color = CHORE_COLORS[form.color_index] || CHORE_COLORS[0]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-box" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {chore ? 'Edit Chore' : 'New Chore'}
          </h2>
          <button className="btn-ghost p-2" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
            <input className="input-glass" placeholder="e.g. Clean the break room" value={form.title}
              onChange={e => set('title', e.target.value)} required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea className="input-glass resize-none" rows={2} placeholder="Optional details..."
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Due date + Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Due Date</label>
              <input type="date" className="input-glass" value={form.due_date}
                onChange={e => set('due_date', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Color</label>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {CHORE_COLORS.map((c, i) => (
                  <button key={i} type="button" onClick={() => set('color_index', i)}
                    className="w-6 h-6 rounded-full transition-all flex-shrink-0"
                    style={{
                      background: c.border,
                      outline: form.color_index === i ? `3px solid ${c.border}` : 'none',
                      outlineOffset: 2,
                      opacity: form.color_index === i ? 1 : 0.45,
                    }} />
                ))}
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Recurrence</label>
            <select className="input-glass" value={form.recurrence_type}
              onChange={e => set('recurrence_type', e.target.value)}>
              {RECURRENCE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Custom days */}
          <AnimatePresence>
            {form.recurrence_type === 'custom' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">On days</label>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAYS.map((d, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(i)}
                      className="w-10 h-9 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: form.custom_days.includes(i) ? `${color.border}33` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${form.custom_days.includes(i) ? color.border : 'rgba(255,255,255,0.1)'}`,
                        color: form.custom_days.includes(i) ? color.text : '#64748b',
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Assign To</label>
            {members.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No team members yet. Add some in the Team tab.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const selected = form.assignees.includes(m.id)
                  const ac = getAvatarColor(m.name)
                  return (
                    <button key={m.id} type="button" onClick={() => toggleAssignee(m.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all"
                      style={{
                        background: selected ? `${ac}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${selected ? ac : 'rgba(255,255,255,0.08)'}`,
                        color: selected ? ac : '#64748b',
                      }}>
                      <Avatar name={m.name} size={22} />
                      {m.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {chore && (
              <button type="button" onClick={() => onDelete(chore.id)}
                className="btn-ghost flex items-center gap-1.5 px-4 py-2.5 text-red-400 border-red-400/20 hover:bg-red-400/10 hover:border-red-400/40 text-sm font-semibold">
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 text-sm font-semibold flex-1">Cancel</button>
            <button type="submit" disabled={saving}
              className="btn-neon px-5 py-2.5 text-sm font-semibold flex-1 flex items-center justify-center gap-2">
              {saving ? <span className="animate-spin">⟳</span> : <Plus size={16} />}
              {chore ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
