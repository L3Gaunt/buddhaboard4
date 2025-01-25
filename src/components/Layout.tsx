import React from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Sidebar from "./Sidebar";
import { type LayoutProps, type Agent } from '@/types';

interface ExtendedLayoutProps extends LayoutProps {
  currentAgent: Agent | null;
  onLogout: () => Promise<void>;
  isAvailable: boolean;
  setIsAvailable: (available: boolean) => void;
}

const Layout: React.FC<ExtendedLayoutProps> = ({
  currentView,
  setCurrentView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  children,
  currentAgent,
  onLogout,
  isAvailable,
  setIsAvailable,
}) => {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        currentAgent={currentAgent}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
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
          
          <div className="flex items-center gap-4">
            {currentAgent && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Available</span>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                  aria-label="Toggle availability"
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
