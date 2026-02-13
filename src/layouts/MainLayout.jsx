import { Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import Toast from '../components/Toast'

const MainLayout = () => {
  const { sidebarOpen } = useApp()
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: sidebarOpen ? '280px' : '80px'
        }}
      >
        <TopNav />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  )
}

export default MainLayout



















