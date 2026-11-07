import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import useMediaQuery from '../hooks/useMediaQuery'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import Toast from '../components/Toast'

const MainLayout = () => {
  const { sidebarOpen, mobileNavOpen, closeMobileNav } = useApp()
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  useEffect(() => {
    if (isDesktop) closeMobileNav()
  }, [isDesktop, closeMobileNav])

  useEffect(() => {
    if (!mobileNavOpen || isDesktop) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileNavOpen, isDesktop])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      {mobileNavOpen && !isDesktop && (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-black/40"
          aria-label="Close menu"
          onClick={closeMobileNav}
        />
      )}
      <div
        className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out"
        style={isDesktop ? { marginLeft: sidebarOpen ? '256px' : '72px' } : { marginLeft: 0 }}
      >
        <TopNav />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 min-[1025px]:p-4">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  )
}

export default MainLayout
