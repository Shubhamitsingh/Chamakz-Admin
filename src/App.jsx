import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import UserProfile from './pages/UserProfile'
import UserAnalytics from './pages/UserAnalytics'
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
import GeoAnalytics from './pages/GeoAnalytics'
import DiamondSellers from './pages/DiamondSellers'
import DiamondMarketplace from './pages/DiamondMarketplace'
import LiveStreaming from './pages/LiveStreaming'
import Leaderboard from './pages/Leaderboard'
import { EconomyProvider } from './economy/EconomyContext'
import FinanceOverview from './pages/economy/FinanceOverview'
import Purchases from './pages/economy/Purchases'
import { HostWallets, UserWallets } from './pages/economy/Wallets'
import GiftsPage from './pages/economy/GiftsPage'
import Revenue from './pages/economy/Revenue'
import Circulation from './pages/economy/Circulation'
import Reports from './pages/economy/Reports'
import Audit from './pages/economy/Audit'
import { ControlProvider } from './control/ControlContext'
import { ConfigPage, ControlHome, HistoryPage, RolesPage } from './pages/control/ControlPages'
import { BlocksPage, CoinPacksPage, FollowsPage, HostPerformancePage, KycPage, LevelsPage, NearbyPage, NotificationSwitchesPage, PrivateCallsPage, PrivateChatsPage, ReferralsPage, TelegramPage, WarningsPage } from './pages/app-control/UserAppPages'

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
            <Route path="live-streaming" element={<LiveStreaming />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/analytics" element={<UserAnalytics />} />
            <Route path="users/profile/:userId" element={<UserProfile />} />
            <Route path="users/:segment" element={<Users />} />
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
            <Route path="geo-analytics" element={<GeoAnalytics />} />
            <Route path="diamond-sellers" element={<DiamondSellers />} />
            <Route path="diamond-marketplace" element={<DiamondMarketplace />} />
            <Route path="economy" element={<EconomyProvider><Outlet /></EconomyProvider>}>
              <Route index element={<FinanceOverview />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="user-wallets" element={<UserWallets />} />
              <Route path="host-wallets" element={<HostWallets />} />
              <Route path="gifts" element={<GiftsPage />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="withdrawals" element={<Navigate to="/transactions" replace />} />
              <Route path="circulation" element={<Circulation />} />
              <Route path="reports" element={<Reports />} />
              <Route path="audit" element={<Audit />} />
              <Route path="settings" element={<Navigate to="/control/diamonds" replace />} />
            </Route>
            <Route path="control" element={<ControlProvider><Outlet /></ControlProvider>}>
              <Route index element={<ControlHome />} />
              <Route path="hosts" element={<Navigate to="/control/users" replace />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path=":categoryId" element={<ConfigPage />} />
            </Route>
            <Route path="app" element={<Navigate to="/app/warnings" replace />} />
            <Route path="app/warnings" element={<WarningsPage />} />
            <Route path="app/levels" element={<LevelsPage />} />
            <Route path="app/referrals" element={<ReferralsPage />} />
            <Route path="app/calls" element={<PrivateCallsPage />} />
            <Route path="app/follows" element={<FollowsPage />} />
            <Route path="app/blocks" element={<BlocksPage />} />
            <Route path="app/private-chats" element={<PrivateChatsPage />} />
            <Route path="app/kyc" element={<KycPage />} />
            <Route path="app/host-performance" element={<HostPerformancePage />} />
            <Route path="app/coin-packs" element={<CoinPacksPage />} />
            <Route path="app/telegram" element={<TelegramPage />} />
            <Route path="app/nearby" element={<NearbyPage />} />
            <Route path="app/notification-switches" element={<NotificationSwitchesPage />} />
            <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App


