import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, Loader2, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function JoinPage() {
  const { token } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [state, setState] = useState('loading') // 'loading' | 'preview' | 'joining' | 'error'

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate(`/auth?redirect=/join/${token}`, { replace: true })
      return
    }
    fetchWorkspace()
  }, [token, user, authLoading])

  const fetchWorkspace = async () => {
    const { data, error } = await supabase.rpc('get_workspace_by_token', { p_token: token })
    if (error || !data?.length) {
      setState('error')
      return
    }
    setWorkspace(data[0])
    setState('preview')
  }

  const handleJoin = async () => {
    setState('joining')
    const { data, error } = await supabase.rpc('join_workspace_by_token', { p_token: token })
    if (error) {
      toast.error(error.message || 'Failed to join workspace')
      setState('preview')
      return
    }
    toast.success(`Joined ${workspace.name}!`)
    navigate(`/workspace/${data}`, { replace: true })
  }

  if (state === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#555555]" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-[#ef4444] text-lg">!</span>
          </div>
          <h2 className="text-[16px] font-semibold text-white mb-2">Invalid invite link</h2>
          <p className="text-[13.5px] text-[#555555] mb-5">
            This invite link is invalid or has expired. Ask the workspace owner for a new one.
          </p>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#10b981' }}>
            <CheckSquare size={14} className="text-black" />
          </div>
          <span className="font-semibold text-white">ChoreOS</span>
        </div>

        <div className="card p-7 text-center">
          <div className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center text-xl font-bold text-[#10b981]"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            {workspace?.name?.[0]?.toUpperCase() || '?'}
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Users size={13} className="text-[#555555]" />
            <span className="text-[12px] text-[#555555]">Workspace invitation</span>
          </div>

          <h2 className="text-[18px] font-semibold text-white mb-1.5">{workspace?.name}</h2>
          {workspace?.description && (
            <p className="text-[13px] text-[#666666] mb-5">{workspace.description}</p>
          )}

          <p className="text-[13px] text-[#555555] mb-6">
            You've been invited to collaborate on this workspace. Join to start contributing.
          </p>

          <button
            onClick={handleJoin}
            disabled={state === 'joining'}
            className="btn btn-primary w-full py-2.5"
          >
            {state === 'joining'
              ? <><Loader2 size={14} className="animate-spin" /> Joining...</>
              : 'Accept invitation'}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost w-full mt-2"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </div>
  )
}
