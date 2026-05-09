import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import WorkspacePage from './pages/WorkspacePage'
import JoinPage from './pages/JoinPage'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c1c',
            color: '#eeeeee',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            fontSize: 13,
            padding: '10px 14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1c1c1c' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1c1c1c' } },
          duration: 3000,
        }}
      />

      <Routes>
        <Route path="/auth" element={
          <RedirectIfAuthed><AuthPage /></RedirectIfAuthed>
        } />
        <Route path="/dashboard" element={
          <RequireAuth><DashboardPage /></RequireAuth>
        } />
        <Route path="/workspace/:id" element={
          <RequireAuth><WorkspacePage /></RequireAuth>
        } />
        <Route path="/join/:token" element={
          <RequireAuth><JoinPage /></RequireAuth>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
