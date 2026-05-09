import { motion } from 'framer-motion'
import { Users, Crown, Trash2, Share2 } from 'lucide-react'
import Avatar from './Avatar'
import { useAuth } from '../hooks/useAuth'

export default function TeamPanel({ members, tasks, workspace, onRemoveMember, onShare }) {
  const { user } = useAuth()
  const isOwner = workspace?.owner_id === user?.id

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-white">Team</h2>
          <p className="text-[12.5px] text-[#555555] mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onShare}>
          <Share2 size={13} /> Invite people
        </button>
      </div>

      {members.length === 0 ? (
        <EmptyTeam onShare={onShare} />
      ) : (
        <div className="space-y-2">
          {members.map((m, i) => {
            const memberProfile = m.profiles
            const name = memberProfile?.name || 'Member'
            const isSelf = m.user_id === user?.id
            const memberIsOwner = m.role === 'owner'
            const assignedCount = tasks.filter(t =>
              (t.task_assignees || []).some(a => a.user_id === m.user_id)
            ).length
            const completedCount = tasks.filter(t =>
              t.completed && (t.task_assignees || []).some(a => a.user_id === m.user_id)
            ).length

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Avatar name={name} size={36} color={memberProfile?.avatar_color} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-white truncate">{name}</span>
                    {memberIsOwner && (
                      <span className="flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <Crown size={9} /> Owner
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[10.5px] font-medium text-[#444444]">you</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11.5px] text-[#555555]">{assignedCount} assigned</span>
                    {assignedCount > 0 && (
                      <span className="text-[11.5px] text-[#10b981]">{completedCount} done</span>
                    )}
                  </div>
                </div>

                {assignedCount > 0 && (
                  <div className="flex-shrink-0 w-20">
                    <div className="flex justify-between text-[10.5px] text-[#444444] mb-1">
                      <span>Progress</span>
                      <span>{Math.round(completedCount / assignedCount * 100)}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.round(completedCount / assignedCount * 100)}%`, background: '#10b981' }} />
                    </div>
                  </div>
                )}

                {((isOwner && !isSelf) || (!isOwner && isSelf)) && (
                  <button
                    onClick={() => onRemoveMember(m.user_id)}
                    className="btn btn-ghost p-1.5 text-[#444444] hover:text-red-400 flex-shrink-0"
                    title={isSelf ? 'Leave workspace' : 'Remove member'}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyTeam({ onShare }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Users size={20} className="text-[#333333]" />
      </div>
      <h3 className="text-[14px] font-semibold text-[#555555] mb-1.5">Just you so far</h3>
      <p className="text-[12.5px] text-[#3a3a3a] mb-5 max-w-xs">
        Invite teammates to collaborate on tasks together.
      </p>
      <button className="btn btn-secondary text-[12.5px]" onClick={onShare}>
        <Share2 size={13} /> Invite people
      </button>
    </div>
  )
}
