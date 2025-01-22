import { XCircle, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import type { Agent } from "@/types";

interface AgentSettingsModalProps {
  isAvailable: boolean;
  setIsAvailable: (available: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  currentAgent: Agent | null;
}

export function AgentSettingsModal({
  isAvailable,
  setIsAvailable,
  showSettings,
  setShowSettings,
  currentAgent,
}: AgentSettingsModalProps) {
  if (!showSettings) return null;

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload(); // Refresh the page to reset the app state
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Agent Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(false)}
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-4">
          {currentAgent && (
            <div className="p-4 border rounded-lg space-y-3">
              <h3 className="font-medium">Personal Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 text-gray-600 font-semibold">
                    {currentAgent.avatar && currentAgent.avatar.startsWith('http') ? (
                      <img 
                        src={currentAgent.avatar} 
                        alt={currentAgent.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, show initials instead
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerText = currentAgent.name.substring(0, 2).toUpperCase();
                        }}
                      />
                    ) : (
                      currentAgent.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{currentAgent.name}</p>
                    <p className="text-sm text-gray-500">{currentAgent.email}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p><span className="font-medium">Role:</span> {currentAgent.role}</p>
                  {currentAgent.metadata?.department && (
                    <p><span className="font-medium">Department:</span> {currentAgent.metadata.department}</p>
                  )}
                  {currentAgent.metadata?.skills && (
                    <p><span className="font-medium">Skills:</span> {currentAgent.metadata.skills.join(', ')}</p>
                  )}
                  {currentAgent.metadata?.languages && (
                    <p><span className="font-medium">Languages:</span> {currentAgent.metadata.languages.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Availability Status</h3>
              <p className="text-sm text-gray-500">
                Set your current availability
              </p>
            </div>
            <Button
              variant={isAvailable ? "default" : "secondary"}
              onClick={() => setIsAvailable(!isAvailable)}
            >
              {isAvailable ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {isAvailable ? "Available" : "Away"}
            </Button>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
} 