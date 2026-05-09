import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, Check, Link, RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ShareModal({ workspace, onClose }) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [inviteToken, setInviteToken] = useState(workspace.invite_token)

  const inviteUrl = `${window.location.origin}/join/${inviteToken}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleRegenerate = async () => {
    if (!confirm('Regenerate the invite link? The old link will stop working.')) return
    setRegenerating(true)
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const { error } = await supabase
      .from('workspaces')
      .update({ invite_token: newToken })
      .eq('id', workspace.id)
    setRegenerating(false)
    if (error) { toast.error('Failed to regenerate'); return }
    setInviteToken(newToken)
    toast.success('New invite link generated')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal-box p-6"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[16px] font-semibold text-white">Share workspace</h2>
            <p className="text-[12.5px] text-[#555555] mt-0.5">{workspace.name}</p>
          </div>
          <button className="btn btn-ghost p-1.5" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="rounded-lg p-4 mb-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Link size={13} className="text-[#555555]" />
            <span className="text-[12px] font-medium text-[#888888]">Invite link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-md px-3 py-2.5 text-[12px] text-[#888888] font-mono truncate"
              style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.07)' }}>
              {inviteUrl}
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-secondary flex-shrink-0 px-3 py-2"
            >
              {copied ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="rounded-lg p-3.5 mb-5" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
          <p className="text-[12.5px] text-[#888888] leading-relaxed">
            Anyone with this link can join your workspace as a member. Share it only with people you trust.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn btn-ghost text-[12.5px] text-[#555555] hover:text-[#888888]"
          >
            {regenerating
              ? <Loader2 size={13} className="animate-spin" />
              : <RefreshCw size={13} />}
            Regenerate link
          </button>
          <button
            onClick={handleCopy}
            className="btn btn-primary"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
