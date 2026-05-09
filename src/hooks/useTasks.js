import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks(workspaceId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select(`*, task_assignees(user_id, profiles(id, name, avatar_color))`)
      .eq('workspace_id', workspaceId)
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data || [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    fetch()

    if (!workspaceId) return
    const channel = supabase
      .channel(`tasks:${workspaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => fetch())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workspaceId, fetch])

  const addTask = async (task) => {
    const { assignees = [], ...rest } = task
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...rest, workspace_id: workspaceId })
      .select()
      .single()
    if (error || !data) return { error }
    if (assignees.length) {
      await supabase.from('task_assignees').insert(
        assignees.map(userId => ({ task_id: data.id, user_id: userId }))
      )
    }
    await fetch()
    return { data }
  }

  const updateTask = async (id, updates) => {
    const { assignees, ...rest } = updates
    const { error } = await supabase
      .from('tasks')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error }
    if (assignees !== undefined) {
      await supabase.from('task_assignees').delete().eq('task_id', id)
      if (assignees.length) {
        await supabase.from('task_assignees').insert(
          assignees.map(userId => ({ task_id: id, user_id: userId }))
        )
      }
    }
    await fetch()
    return {}
  }

  const deleteTask = async (id) => {
    await supabase.from('task_assignees').delete().eq('task_id', id)
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const toggleComplete = async (id, completed) => {
    await supabase.from('tasks').update({ completed, updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
  }

  return { tasks, loading, addTask, updateTask, deleteTask, toggleComplete, refetch: fetch }
}
