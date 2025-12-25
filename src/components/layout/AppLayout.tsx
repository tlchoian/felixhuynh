import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileSidebarDrawer } from "./MobileSidebarDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && <MobileHeader onMenuClick={() => setSidebarOpen(true)} />}
      
      {/* Mobile Sidebar Drawer */}
      <MobileSidebarDrawer open={sidebarOpen} onOpenChange={setSidebarOpen} />
      
      {/* Desktop Sidebar */}
      {!isMobile && <AppSidebar />}
      
      <main className={`min-h-screen transition-all duration-300 ${isMobile ? 'pt-14' : 'ml-64'}`}>
        <div className={`${isMobile ? 'p-4' : 'p-8'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
