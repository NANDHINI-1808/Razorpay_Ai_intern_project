import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <div className={collapsed ? 'hidden' : 'block'}>
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setCollapsed(v => !v)} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
