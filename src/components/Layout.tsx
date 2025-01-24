import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import { type LayoutProps, type Agent } from '@/types';

interface ExtendedLayoutProps extends LayoutProps {
  currentAgent: Agent | null;
}

const Layout: React.FC<ExtendedLayoutProps> = ({
  currentView,
  setCurrentView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  children,
  setShowSettings,
  currentAgent,
}) => {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        currentAgent={currentAgent}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setShowSettings={setShowSettings}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
