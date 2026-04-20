import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useChores() {
  const [chores, setChores] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchChores = useCallback(async () => {
    const { data, error } = await supabase
      .from('chores')
      .select(`*, chore_assignments(member_id, members(id, name, email))`)
      .order('due_date', { ascending: true })
    if (!error) setChores(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchChores() }, [fetchChores])

  const addChore = async (chore) => {
    const { assignees = [], ...rest } = chore
    const { data, error } = await supabase.from('chores').insert(rest).select().single()
    if (error || !data) return { error }
    if (assignees.length) {
      await supabase.from('chore_assignments').insert(
        assignees.map(id => ({ chore_id: data.id, member_id: id }))
      )
    }
    await fetchChores()
    return { data }
  }

  const updateChore = async (id, updates) => {
    const { assignees, ...rest } = updates
    const { error } = await supabase.from('chores').update(rest).eq('id', id)
    if (error) return { error }
    if (assignees !== undefined) {
      await supabase.from('chore_assignments').delete().eq('chore_id', id)
      if (assignees.length) {
        await supabase.from('chore_assignments').insert(
          assignees.map(mid => ({ chore_id: id, member_id: mid }))
        )
      }
    }
    await fetchChores()
    return {}
  }

  const deleteChore = async (id) => {
    await supabase.from('chore_assignments').delete().eq('chore_id', id)
    await supabase.from('chores').delete().eq('id', id)
    await fetchChores()
  }

  const toggleComplete = async (id, completed) => {
    await supabase.from('chores').update({ completed }).eq('id', id)
    setChores(prev => prev.map(c => c.id === id ? { ...c, completed } : c))
  }

  return { chores, loading, addChore, updateChore, deleteChore, toggleComplete, refetch: fetchChores }
}
