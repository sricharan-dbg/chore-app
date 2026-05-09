import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  // Upsert profile — called after signup to handle cases where the DB trigger
  // didn't fire or ran before the session was established
  const ensureProfile = async (userId, name, email) => {
    const displayName = name?.trim() || email?.split('@')[0] || 'User'
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, name: displayName }, { onConflict: 'id' })
    if (!error) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) setProfile(data)
    }
    return { error }
  }

  const signUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name?.trim() } },
    })

    if (error) return { data: null, error }

    // When email confirmation is disabled, we get a session immediately.
    // Upsert the profile client-side as a fallback in case the DB trigger
    // didn't run correctly.
    if (data?.session && data?.user) {
      await ensureProfile(data.user.id, name, email)
    }

    return { data, error: null }
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates) => {
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    if (!error) setProfile(prev => ({ ...prev, ...updates }))
    return { error }
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading: session === undefined,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refetchProfile: () => session && fetchProfile(session.user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
