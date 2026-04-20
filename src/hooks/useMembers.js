import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true })
    if (!error) setMembers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const addMember = async (member) => {
    const { data, error } = await supabase.from('members').insert(member).select().single()
    if (!error) setMembers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { data, error }
  }

  const removeMember = async (id) => {
    await supabase.from('chore_assignments').delete().eq('member_id', id)
    await supabase.from('members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  return { members, loading, addMember, removeMember, refetch: fetchMembers }
}
