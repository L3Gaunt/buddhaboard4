import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Agent, AgentRole } from "@/types";

interface EditAgentModalProps {
  agent: Agent;
  onClose: () => void;
  onSave: (updatedAgent: Partial<Agent>) => Promise<void>;
  onPasswordChange: (agentId: string, newPassword: string) => Promise<void>;
}

export function EditAgentModal({
  agent,
  onClose,
  onSave,
  onPasswordChange,
}: EditAgentModalProps) {
  const [name, setName] = useState(agent.name);
  const [email, setEmail] = useState(agent.email);
  const [role, setRole] = useState(agent.role);
  const [department, setDepartment] = useState(agent.metadata?.department || "");
  const [skills, setSkills] = useState(agent.metadata?.skills?.join(", ") || "");
  const [languages, setLanguages] = useState(agent.metadata?.languages?.join(", ") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Validate passwords if attempting to change
      if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
      }

      const updatedAgent: Partial<Agent> = {
        name,
        email,
        role,
        metadata: {
          ...agent.metadata,
          department,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          languages: languages.split(",").map(l => l.trim()).filter(Boolean),
        },
      };
      
      await onSave(updatedAgent);
      
      if (newPassword) {
        await onPasswordChange(agent.id, newPassword);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Agent Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select
              value={role}
              onValueChange={(value: AgentRole) => setRole(value)}
            >
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="agent">Agent</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Support, Sales"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
            <Input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., Technical Support, Customer Service"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Languages (comma-separated)</label>
            <Input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="e.g., English, Spanish"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-2">Change Password</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 