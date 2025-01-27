import React, { useState, useEffect, useRef } from "react";
import { Menu, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type LayoutProps, type Agent, Views } from '@/types';
import { cn } from "@/lib/utils";
import { AgentCard } from "@/components/AgentCard";

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
  const [showProfileCard, setShowProfileCard] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showProfileCard &&
        profileCardRef.current &&
        profileButtonRef.current &&
        !profileCardRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setShowProfileCard(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileCard]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <button
                  onClick={() => setCurrentView(Views.TICKETS)}
                  className="text-xl font-bold text-blue-600"
                >
                  BuddhaBoard
                </button>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setCurrentView(Views.TICKETS)}
                  className={cn(
                    "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                    currentView === Views.TICKETS
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  Tickets
                </button>
                {currentAgent && (
                  <button
                    onClick={() => setCurrentView(Views.AGENTS)}
                    className={cn(
                      "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                      currentView === Views.AGENTS
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    Agents
                  </button>
                )}
                <button
                  onClick={() => setCurrentView(Views.KNOWLEDGE_BASE)}
                  className={cn(
                    "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                    currentView === Views.KNOWLEDGE_BASE
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  Knowledge Base
                </button>
                {currentAgent && (
                  <button
                    onClick={() => setCurrentView(Views.FEEDBACK)}
                    className={cn(
                      "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                      currentView === Views.FEEDBACK
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    Feedback
                  </button>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <div className="flex items-center space-x-4">
                {currentAgent && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Available</span>
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={setIsAvailable}
                    />
                  </div>
                )}
                {currentAgent && (
                  <div className="relative">
                    <button
                      ref={profileButtonRef}
                      onClick={() => setShowProfileCard(!showProfileCard)}
                      className="flex items-center space-x-2 rounded-full bg-gray-100 px-3 py-1.5 hover:bg-gray-200"
                    >
                      <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                        {currentAgent.avatar.startsWith('http') ? (
                          <img 
                            src={currentAgent.avatar} 
                            alt={currentAgent.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          currentAgent.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium">{currentAgent.name}</span>
                    </button>
                    {showProfileCard && (
                      <div 
                        ref={profileCardRef}
                        className="absolute right-0 mt-2 w-80 z-50 bg-white rounded-lg shadow-lg border border-gray-200"
                      >
                        <AgentCard
                          agent={{
                            ...currentAgent,
                            status: isAvailable ? 'online' : 'away'
                          }}
                          showStatus={true}
                          onClick={() => setShowProfileCard(false)}
                        />
                      </div>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={cn("sm:hidden", isMobileMenuOpen ? "block" : "hidden")}>
          <div className="space-y-1 pb-3 pt-2">
            <button
              onClick={() => {
                setCurrentView(Views.TICKETS);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "block border-l-4 py-2 pl-3 pr-4 text-base font-medium",
                currentView === Views.TICKETS
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              Tickets
            </button>
            {currentAgent && (
              <button
                onClick={() => {
                  setCurrentView(Views.AGENTS);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "block border-l-4 py-2 pl-3 pr-4 text-base font-medium",
                  currentView === Views.AGENTS
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                Agents
              </button>
            )}
            <button
              onClick={() => {
                setCurrentView(Views.KNOWLEDGE_BASE);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "block border-l-4 py-2 pl-3 pr-4 text-base font-medium",
                currentView === Views.KNOWLEDGE_BASE
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              Knowledge Base
            </button>
            {currentAgent && (
              <button
                onClick={() => {
                  setCurrentView(Views.FEEDBACK);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "block border-l-4 py-2 pl-3 pr-4 text-base font-medium",
                  currentView === Views.FEEDBACK
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                Feedback
              </button>
            )}
          </div>
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="space-y-3 px-4">
              <div className="flex items-center justify-between">
                {currentAgent && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Available</span>
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={setIsAvailable}
                    />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

export default Layout;
