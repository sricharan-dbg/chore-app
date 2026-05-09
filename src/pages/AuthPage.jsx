import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, ArrowRight, Loader2, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/dashboard'

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    if (mode === 'signup' && !form.name.trim()) return

    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await signUp({ name: form.name.trim(), email: form.email, password: form.password })
      setLoading(false)
      if (error) {
        toast.error(error.message || 'Failed to create account')
        return
      }
      // Supabase returns session=null when email confirmation is required
      if (!data?.session) {
        setAwaitingConfirmation(true)
        return
      }
      toast.success('Account created! Welcome.')
      navigate(redirect, { replace: true })
    } else {
      const { error } = await signIn({ email: form.email, password: form.password })
      setLoading(false)
      if (error) {
        toast.error(error.message || 'Invalid email or password')
        return
      }
      navigate(redirect, { replace: true })
    }
  }

  const toggle = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setForm({ name: '', email: '', password: '' })
    setAwaitingConfirmation(false)
  }

  // Email confirmation pending state
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Mail size={22} className="text-[#10b981]" />
          </div>
          <h2 className="text-[20px] font-semibold text-white mb-2">Check your inbox</h2>
          <p className="text-[13.5px] text-[#666666] leading-relaxed mb-6">
            We sent a confirmation link to <span className="text-white">{form.email}</span>.
            Click it to activate your account, then come back and sign in.
          </p>
          <button
            className="btn btn-secondary w-full"
            onClick={() => { setAwaitingConfirmation(false); setMode('signin') }}
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12"
        style={{ background: '#0f0f0f', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#10b981' }}>
              <CheckSquare size={16} className="text-black" />
            </div>
            <span className="font-semibold text-[15px] text-white">ChoreOS</span>
          </div>

          <h1 className="text-3xl font-semibold text-white leading-tight mb-4">
            Your workspace,<br />your rules.
          </h1>
          <p className="text-[#666666] text-[15px] leading-relaxed">
            Private task boards with invite-only sharing. Built for teams that actually get things done.
          </p>

          <div className="mt-12 space-y-4">
            {[
              'Private workspaces — your tasks stay yours',
              'Invite collaborators via secure links',
              'Assign tasks, set due dates, track progress',
              'Real-time updates across your team',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                </div>
                <span className="text-[13.5px] text-[#888888]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-[#444444]">
          Built with Supabase · React · Tailwind
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0c0c0c]">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#10b981' }}>
              <CheckSquare size={14} className="text-black" />
            </div>
            <span className="font-semibold text-white">ChoreOS</span>
          </div>

          <h2 className="text-[22px] font-semibold text-white mb-1.5">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-[13.5px] text-[#666666] mb-8">
            {mode === 'signin'
              ? 'Sign in to access your workspaces'
              : 'Start managing tasks with your team'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[12px] font-medium text-[#888888] mb-1.5">Your name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-[#888888] mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                autoFocus={mode === 'signin'}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#888888] mb-1.5">Password</label>
              <input
                className="input"
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-1 py-2.5 text-[14px] font-medium"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[13px] text-[#555555]">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={toggle}
              className="text-[13px] text-[#10b981] hover:text-[#0ea370] font-medium transition-colors"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
