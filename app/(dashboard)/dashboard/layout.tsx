import DashboardHeader from '@/app/components/common/DashboardHeader'
import Sidebar from '@/app/components/common/Sidebar'
import Footor from '@/app/components/common/footer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen font-poppins bg-[#FAFAFA]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <DashboardHeader />

        {/* Page content */}
        <main className="mt-20 p-6 flex-1">{children}</main>

        {/* Footer */}
        <Footor />
      </div>
    </div>
  )
}
