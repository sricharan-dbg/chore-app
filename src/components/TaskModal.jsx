import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Loader2, Check } from 'lucide-react'
import { TASK_COLORS } from '../lib/colors'
import { RECURRENCE_TYPES, WEEKDAYS } from '../lib/recurrence'
import Avatar from './Avatar'

const EMPTY = {
  title: '', description: '', due_date: '', color_index: 0,
  recurrence_type: 'none', custom_days: [], assignees: [],
  completed: false, priority: 'medium',
}

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
]

export default function TaskModal({ task, members, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      const assigneeIds = (task.task_assignees || []).map(a => a.user_id)
      setForm({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date || '',
        color_index: task.color_index ?? 0,
        recurrence_type: task.recurrence_type || 'none',
        custom_days: task.custom_days || [],
        assignees: assigneeIds,
        completed: task.completed || false,
        priority: task.priority || 'medium',
      })
    } else {
      setForm(EMPTY)
    }
  }, [task])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleDay = (d) => set('custom_days',
    form.custom_days.includes(d) ? form.custom_days.filter(x => x !== d) : [...form.custom_days, d]
  )

  const toggleAssignee = (id) => set('assignees',
    form.assignees.includes(id) ? form.assignees.filter(x => x !== id) : [...form.assignees, id]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const color = TASK_COLORS[form.color_index] || TASK_COLORS[0]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-[15px] font-semibold text-white">
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button className="btn btn-ghost p-1.5" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11.5px] font-medium text-[#666666] mb-1.5 uppercase tracking-wider">
              Task title
            </label>
            <input
              className="input text-[15px] font-medium"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11.5px] font-medium text-[#666666] mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="Add details..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Due date + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium text-[#666666] mb-1.5 uppercase tracking-wider">
                Due date
              </label>
              <input
                type="date"
                className="input"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#666666] mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <div className="flex gap-1.5">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('priority', p.value)}
                    className="flex-1 py-2 rounded-lg text-[11.5px] font-medium transition-all"
                    style={{
                      background: form.priority === p.value ? `${p.color}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.priority === p.value ? `${p.color}44` : 'rgba(255,255,255,0.08)'}`,
                      color: form.priority === p.value ? p.color : '#555555',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-[11.5px] font-medium text-[#666666] mb-1.5 uppercase tracking-wider">
              Recurrence
            </label>
            <select
              className="input"
              value={form.recurrence_type}
              onChange={e => set('recurrence_type', e.target.value)}
            >
              {RECURRENCE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Custom weekdays */}
          <AnimatePresence>
            {form.recurrence_type === 'custom' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <label className="block text-[11.5px] font-medium text-[#666666] mb-2 uppercase tracking-wider">
                  On days
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEKDAYS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className="w-10 h-8 rounded-lg text-[11.5px] font-semibold transition-all"
                      style={{
                        background: form.custom_days.includes(i) ? `${color.border}20` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.custom_days.includes(i) ? color.border : 'rgba(255,255,255,0.08)'}`,
                        color: form.custom_days.includes(i) ? color.text : '#555555',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color */}
          <div>
            <label className="block text-[11.5px] font-medium text-[#666666] mb-2 uppercase tracking-wider">
              Color label
            </label>
            <div className="flex gap-2 flex-wrap">
              {TASK_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => set('color_index', i)}
                  title={c.label}
                  className="w-6 h-6 rounded-full transition-all flex-shrink-0"
                  style={{
                    background: c.border,
                    opacity: form.color_index === i ? 1 : 0.35,
                    outline: form.color_index === i ? `2px solid ${c.border}` : 'none',
                    outlineOffset: 2,
                    transform: form.color_index === i ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Assignees */}
          {members.length > 0 && (
            <div>
              <label className="block text-[11.5px] font-medium text-[#666666] mb-2 uppercase tracking-wider">
                Assign to
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const selected = form.assignees.includes(m.user_id)
                  const memberProfile = m.profiles
                  const name = memberProfile?.name || 'Member'
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => toggleAssignee(m.user_id)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] transition-all"
                      style={{
                        background: selected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${selected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        color: selected ? '#10b981' : '#666666',
                      }}
                    >
                      {selected && <Check size={11} className="text-[#10b981]" />}
                      <Avatar name={name} size={20} />
                      <span>{name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed toggle (edit mode only) */}
          {task && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => set('completed', !form.completed)}
                className="flex items-center gap-2.5 text-[13px] transition-colors"
                style={{ color: form.completed ? '#10b981' : '#555555' }}
              >
                <div className="w-4 h-4 rounded border flex items-center justify-center transition-all"
                  style={{
                    background: form.completed ? '#10b981' : 'transparent',
                    borderColor: form.completed ? '#10b981' : 'rgba(255,255,255,0.2)',
                  }}>
                  {form.completed && <Check size={10} className="text-black" />}
                </div>
                Mark as completed
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {task && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="btn btn-danger"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button
            type="submit"
            form="task-form"
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving
              ? <Loader2 size={13} className="animate-spin" />
              : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
