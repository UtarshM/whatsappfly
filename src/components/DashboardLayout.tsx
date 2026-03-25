import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
<<<<<<< HEAD
import { useAppContext } from "@/context/AppContext";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, walletBalance, whatsApp } = useAppContext();

=======

export function DashboardLayout({ children }: { children: React.ReactNode }) {
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
<<<<<<< HEAD
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {user ? `Welcome back, ${user.name}` : "WaBiz Workspace"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {whatsApp.connected ? `${whatsApp.displayPhoneNumber} connected` : "Connect WhatsApp to start messaging"}
                </p>
              </div>
            </div>
            <div className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
              Wallet: Rs {walletBalance.toLocaleString()}
            </div>
=======
          <header className="h-14 flex items-center border-b border-border px-4 bg-card">
            <SidebarTrigger className="mr-4" />
>>>>>>> c444db471bbad9730b79c5546bdc0d731725dc5e
          </header>
          <main className="flex-1 p-6 overflow-auto gradient-subtle">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
