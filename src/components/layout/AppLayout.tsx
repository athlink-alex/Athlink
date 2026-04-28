import { type ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  // Dashboard pages (showSidebar=true) always render in premium dark mode
  // Public/landing pages keep the default theme behavior
  if (showSidebar) {
    return (
      <div className="dark min-h-screen bg-[#070A14]">
        <Navbar variant="dashboard" />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-[calc(100vh-4rem)] bg-[#070A14]">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <div className="flex">
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}