import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-16 shrink-0 border-b border-border/50 bg-background/50 backdrop-blur-xl flex items-center px-4 justify-between relative z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
              {/* User profile placeholder */}
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-medium">
                AD
              </div>
            </div>
          </header>
          
          {/* Page Content */}
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
