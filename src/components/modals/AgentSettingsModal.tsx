import { XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentSettingsModalProps {
  isAvailable: boolean;
  setIsAvailable: (available: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export function AgentSettingsModal({
  isAvailable,
  setIsAvailable,
  showSettings,
  setShowSettings,
}: AgentSettingsModalProps) {
  if (!showSettings) return null;

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
        </div>
      </div>
    </div>
  );
} 