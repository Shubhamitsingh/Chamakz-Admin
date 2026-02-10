import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Transactions from './pages/Transactions'
import TicketsV2 from './pages/TicketsV2'
import Chats from './pages/Chats'
import ChamakzTeam from './pages/ChamakzTeam'
import Banners from './pages/Banners'
import Gifts from './pages/Gifts'
import HostApplications from './pages/HostApplications'
import Feedback from './pages/Feedback'
import Events from './pages/Events'
import Settings from './pages/Settings'
import Complaints from './pages/Complaints'

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="tickets" element={<TicketsV2 />} />
            <Route path="chats" element={<Chats />} />
            <Route path="chamakz-team" element={<ChamakzTeam />} />
            <Route path="banners" element={<Banners />} />
            <Route path="gifts" element={<Gifts />} />
            <Route path="host-applications" element={<HostApplications />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="events" element={<Events />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App


