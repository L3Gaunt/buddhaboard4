import type { FC } from 'react';
import { Inbox, Users, Book, Star, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SidebarProps, Views, type Agent } from '@/types';

interface ExtendedSidebarProps extends SidebarProps {
  currentAgent: Agent | null;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  setShowSettings: (show: boolean) => void;
}

const Sidebar: FC<ExtendedSidebarProps> = ({
  currentView,
  setCurrentView,
  isMobileMenuOpen,
  currentAgent,
  setIsMobileMenuOpen,
  setShowSettings,
}) => {
  const isCustomer = !currentAgent;

  return (
    <div
      className={`${isMobileMenuOpen ? "block" : "hidden"} md:block fixed md:relative z-40 w-64 h-full bg-white border-r border-gray-200`}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800">BuddhaBoard</h1>
      </div>
      
      <div className="flex flex-col h-[calc(100%-4rem)]">
        <nav className="p-4 space-y-2 flex-1">
          <Button
            variant={currentView === Views.TICKETS ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentView(Views.TICKETS)}
          >
            <Inbox className="mr-2 h-4 w-4" />
            Tickets
          </Button>

          {!isCustomer && (
            <>
              <Button
                variant={currentView === Views.AGENTS ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentView(Views.AGENTS)}
              >
                <Users className="mr-2 h-4 w-4" />
                Agents
              </Button>
              <Button
                variant={currentView === Views.FEEDBACK ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentView(Views.FEEDBACK)}
              >
                <Star className="mr-2 h-4 w-4" />
                Feedback
              </Button>
            </>
          )}

          <Button
            variant={currentView === Views.KNOWLEDGE_BASE ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentView(Views.KNOWLEDGE_BASE)}
          >
            <Book className="mr-2 h-4 w-4" />
            Knowledge Base
          </Button>
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
