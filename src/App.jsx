import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Wallet from './pages/Wallet'
import Transactions from './pages/Transactions'
import TicketsV2 from './pages/TicketsV2'
import Chats from './pages/Chats'
import Feedback from './pages/Feedback'
import Approvals from './pages/Approvals'
import CoinReseller from './pages/CoinReseller'
import Events from './pages/Events'
import Settings from './pages/Settings'

function App() {
  return (
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
            <Route path="wallet" element={<Wallet />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="tickets" element={<TicketsV2 />} />
            <Route path="chats" element={<Chats />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="coinreseller" element={<CoinReseller />} />
            <Route path="events" element={<Events />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  )
}

export default App


