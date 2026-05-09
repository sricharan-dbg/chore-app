import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { isBefore, parseISO, startOfDay } from 'date-fns'
import { useWorkspace } from '../hooks/useWorkspaces'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import Sidebar from '../components/Sidebar'
import TasksList from '../components/TasksList'
import CalendarView from '../components/CalendarView'
import TeamPanel from '../components/TeamPanel'
import TaskModal from '../components/TaskModal'
import ShareModal from '../components/ShareModal'
import toast from 'react-hot-toast'

export default function WorkspacePage() {
  const { id: workspaceId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { workspace, members, loading: wsLoading, isMember, removeMember, refetch: refetchWs } = useWorkspace(workspaceId)
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask, toggleComplete } = useTasks(workspaceId)

  const [tab, setTab] = useState('tasks')
  const [modalTask, setModalTask] = useState(null) // null=closed, false=new, object=edit
  const [defaultDate, setDefaultDate] = useState(null)
  const [showShare, setShowShare] = useState(false)

  const today = startOfDay(new Date())
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.due_date && isBefore(parseISO(t.due_date), today)).length,
  }), [tasks, today])

  const isOwner = workspace?.owner_id === user?.id

  const handleSave = async (form) => {
    const payload = {
      title: form.title,
      description: form.description,
      due_date: form.due_date || null,
      color_index: form.color_index,
      recurrence_type: form.recurrence_type,
      custom_days: form.custom_days,
      completed: form.completed,
      priority: form.priority,
      assignees: form.assignees,
    }
    if (modalTask) {
      const { error } = await updateTask(modalTask.id, payload)
      if (error) { toast.error('Failed to update task'); return }
      toast.success('Task updated')
    } else {
      const { error } = await addTask({ ...payload, created_by: user.id })
      if (error) { toast.error('Failed to create task'); return }
      toast.success('Task created')
    }
    setModalTask(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    await deleteTask(id)
    toast.success('Task deleted')
    setModalTask(null)
  }

  const handleRemoveMember = async (userId) => {
    const isSelf = userId === user?.id
    if (!confirm(isSelf ? 'Leave this workspace?' : 'Remove this member?')) return
    const { error } = await removeMember(userId)
    if (error) { toast.error('Failed'); return }
    if (isSelf) {
      toast.success('Left workspace')
      navigate('/dashboard', { replace: true })
    } else {
      toast.success('Member removed')
    }
  }

  if (wsLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#444444]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[13px]">Loading workspace...</span>
        </div>
      </div>
    )
  }

  if (!workspace || !isMember) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <h2 className="text-[16px] font-semibold text-white mb-2">Workspace not found</h2>
          <p className="text-[13.5px] text-[#555555] mb-5">
            You don't have access to this workspace.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0c0c0c] overflow-hidden">
      <Sidebar
        tab={tab}
        setTab={setTab}
        stats={stats}
        workspace={workspace}
        isOwner={isOwner}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-y-auto px-6 py-6"
          >
            {tab === 'tasks' && (
              <TasksList
                tasks={tasks}
                onTaskClick={t => setModalTask(t)}
                onAdd={() => { setDefaultDate(null); setModalTask(false) }}
                onToggle={toggleComplete}
              />
            )}
            {tab === 'calendar' && (
              <CalendarView
                tasks={tasks}
                onTaskClick={t => setModalTask(t)}
                onDayClick={day => { setDefaultDate(day); setModalTask(false) }}
              />
            )}
            {tab === 'team' && (
              <TeamPanel
                members={members}
                tasks={tasks}
                workspace={workspace}
                onRemoveMember={handleRemoveMember}
                onShare={() => setShowShare(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Task modal */}
      <AnimatePresence>
        {modalTask !== null && (
          <TaskModal
            task={modalTask || null}
            members={members}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => setModalTask(null)}
          />
        )}
      </AnimatePresence>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && workspace && (
          <ShareModal workspace={workspace} onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
