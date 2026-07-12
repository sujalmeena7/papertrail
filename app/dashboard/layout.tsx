import { AppSidebar } from "@/components/app-sidebar"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground">
      {/* Subtle radial gradient background for depth */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      {/* Sidebar - hidden on very small screens, visible on md+ */}
      <div className="hidden md:block z-10 border-r border-border/40 bg-card/30 backdrop-blur-md">
        <AppSidebar userName={session.user.name} userEmail={session.user.email} />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto z-10">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  )
}
