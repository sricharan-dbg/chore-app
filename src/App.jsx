import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { isBefore, parseISO, startOfDay } from 'date-fns'
import { useChores } from './hooks/useChores'
import { useMembers } from './hooks/useMembers'
import Sidebar from './components/Sidebar'
import CalendarView from './components/CalendarView'
import ChoresList from './components/ChoresList'
import TeamPanel from './components/TeamPanel'
import ChoreModal from './components/ChoreModal'
import toast from 'react-hot-toast'

export default function App() {
  const [tab, setTab] = useState('calendar')
  const [modalChore, setModalChore] = useState(null) // null = closed, false = new, object = edit
  const [defaultDate, setDefaultDate] = useState(null)

  const { chores, loading, addChore, updateChore, deleteChore, toggleComplete } = useChores()
  const { members, addMember, removeMember } = useMembers()

  const today = startOfDay(new Date())
  const stats = useMemo(() => ({
    total: chores.length,
    completed: chores.filter(c => c.completed).length,
    pending: chores.filter(c => !c.completed).length,
    overdue: chores.filter(c => !c.completed && c.due_date && isBefore(parseISO(c.due_date), today)).length,
    members: members.length,
  }), [chores, members])

  const handleOpenNew = (date) => {
    setDefaultDate(date || null)
    setModalChore(false)
  }

  const handleSave = async (form) => {
    const payload = {
      title: form.title,
      description: form.description,
      due_date: form.due_date,
      color_index: form.color_index,
      recurrence_type: form.recurrence_type,
      custom_days: form.custom_days,
      completed: form.completed,
      assignees: form.assignees,
    }
    if (modalChore) {
      const { error } = await updateChore(modalChore.id, payload)
      if (error) { toast.error('Failed to update chore'); return }
      toast.success('Chore updated!')
    } else {
      const { error } = await addChore(payload)
      if (error) { toast.error('Failed to create chore'); return }
      toast.success('Chore created!')
    }
    setModalChore(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this chore?')) return
    await deleteChore(id)
    toast.success('Chore deleted')
    setModalChore(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-glow"
            style={{ background: 'linear-gradient(135deg, #b44dff, #4d9fff)' }}>
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Loading ChoreOS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Background orbs */}
      <div className="bg-orbs">
        <div className="orb" style={{ width: 600, height: 600, background: '#b44dff', top: -200, left: -200 }} />
        <div className="orb" style={{ width: 400, height: 400, background: '#4d9fff', bottom: -100, right: -100 }} />
        <div className="orb" style={{ width: 300, height: 300, background: '#ff4daa', top: '40%', left: '40%' }} />
      </div>

      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a2e', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 },
        success: { iconTheme: { primary: '#00ff9f', secondary: '#1a1a2e' } },
        error: { iconTheme: { primary: '#ff6b6b', secondary: '#1a1a2e' } },
      }} />

      {/* Layout */}
      <div className="relative z-10 flex h-screen p-4 gap-4 overflow-hidden">
        {/* Sidebar */}
        <div className="glass rounded-2xl p-4 flex flex-col">
          <Sidebar tab={tab} setTab={setTab} stats={stats} />
        </div>

        {/* Main content */}
        <main className="flex-1 glass rounded-2xl p-6 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
              {tab === 'calendar' && (
                <CalendarView
                  chores={chores}
                  onChoreClick={c => setModalChore(c)}
                  onDayClick={day => handleOpenNew(day)}
                />
              )}
              {tab === 'chores' && (
                <ChoresList
                  chores={chores}
                  onChoreClick={c => setModalChore(c)}
                  onAdd={() => handleOpenNew()}
                  onToggle={(id, val) => toggleComplete(id, val)}
                />
              )}
              {tab === 'team' && (
                <TeamPanel
                  members={members}
                  chores={chores}
                  onAdd={addMember}
                  onRemove={removeMember}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalChore !== null && (
          <ChoreModal
            chore={modalChore || null}
            members={members}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => setModalChore(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
