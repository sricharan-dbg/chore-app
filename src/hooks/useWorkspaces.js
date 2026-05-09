import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useWorkspaces() {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members(count),
        tasks(count)
      `)
      .order('created_at', { ascending: true })
    setWorkspaces(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const createWorkspace = async ({ name, description }) => {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, description, owner_id: user.id })
      .select()
      .single()
    if (error) return { error }

    // Ensure the owner row exists in workspace_members.
    // The DB trigger should handle this, but if it ran before workspace_members
    // was created (partial schema) or failed silently, we add it client-side.
    await supabase
      .from('workspace_members')
      .upsert(
        { workspace_id: data.id, user_id: user.id, role: 'owner' },
        { onConflict: 'workspace_id,user_id' }
      )

    await fetch()
    return { data }
  }

  const deleteWorkspace = async (id) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id)
    if (!error) setWorkspaces(prev => prev.filter(w => w.id !== id))
    return { error }
  }

  const updateWorkspace = async (id, updates) => {
    const { error } = await supabase.from('workspaces').update(updates).eq('id', id)
    if (!error) setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
    return { error }
  }

  return { workspaces, loading, createWorkspace, deleteWorkspace, updateWorkspace, refetch: fetch }
}

export function useWorkspace(workspaceId) {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  const fetch = useCallback(async () => {
    if (!workspaceId || !user) return
    setLoading(true)

    const [{ data: ws }, { data: mems }] = await Promise.all([
      supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
      supabase
        .from('workspace_members')
        .select('*, profiles(id, name, avatar_color)')
        .eq('workspace_id', workspaceId),
    ])

    setWorkspace(ws || null)
    setMembers(mems || [])
    setIsMember(mems?.some(m => m.user_id === user.id) ?? false)
    setLoading(false)
  }, [workspaceId, user])

  useEffect(() => { fetch() }, [fetch])

  const removeMember = async (userId) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
    if (!error) setMembers(prev => prev.filter(m => m.user_id !== userId))
    return { error }
  }

  return { workspace, members, loading, isMember, removeMember, refetch: fetch }
}
