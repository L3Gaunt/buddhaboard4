import type { FC } from 'react';
import { Inbox, BarChart3, Users, MessageSquare, Book, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SidebarProps, Views, type Agent } from '@/types';

interface ExtendedSidebarProps extends SidebarProps {
  currentAgent: Agent | null;
}

const Sidebar: FC<ExtendedSidebarProps> = ({
  currentView,
  setCurrentView,
  isMobileMenuOpen,
  currentAgent,
}) => {
  const isCustomer = !currentAgent;

  return (
    <div
      className={`${isMobileMenuOpen ? "block" : "hidden"} md:block fixed md:relative z-40 w-64 h-full bg-white border-r border-gray-200`}
    >
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">BuddhaBoard</h1>
      </div>
      <nav className="p-4 space-y-2">
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
              variant={currentView === Views.DASHBOARD ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentView(Views.DASHBOARD)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === Views.AGENTS ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentView(Views.AGENTS)}
            >
              <Users className="mr-2 h-4 w-4" />
              Agents
            </Button>
            <Button
              variant={currentView === Views.CHAT ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentView(Views.CHAT)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Live Chat
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
    </div>
  );
}

export default Sidebar;
