import { useState, useEffect } from "react";
import { Send, Copy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type TicketFormData, TicketPriority } from "@/types";
import { createUnauthenticatedTicket, createAuthenticatedTicket } from "@/lib/tickets";
import { getCurrentUser, getUserProfile, signOut } from "@/lib/auth";
import type { Customer } from "@/types";

// Extend TicketFormData to include firstMessage for this form
interface UserTicketFormData extends TicketFormData {
  firstMessage: string;
  email: string;
  password: string;
  name?: string;
}

export function UserTicketView() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [ticketHash, setTicketHash] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<UserTicketFormData>({
    title: "",
    firstMessage: "",
    priority: TicketPriority.MEDIUM,
    email: "",
    password: "",
    name: "",
  });

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        setCurrentUser(profile);
        setFormData(prev => ({
          ...prev,
          email: profile?.email || "",
          name: profile?.name || ""
        }));
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      if (currentUser) {
        // For authenticated users
        result = await createAuthenticatedTicket({
          title: formData.title,
          priority: formData.priority,
          firstMessage: formData.firstMessage,
          customer_id: currentUser.id
        });
        setTicketHash(btoa(`${result.number}:${currentUser.id}`));
      } else {
        // For unauthenticated users
        result = await createUnauthenticatedTicket({
          title: formData.title,
          priority: formData.priority,
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          firstMessage: formData.firstMessage
        });
        setTicketHash(result.ticketHash);
      }
      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit ticket. Please try again.');
    }
  };

  const ticketUrl = `${window.location.origin}/ticket/${ticketHash}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      alert('Ticket link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Ticket Submitted Successfully
            </h2>
            <p className="text-gray-600 mb-6">
              We'll review your ticket and get back to you as soon as possible.
            </p>
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">View your ticket by logging in to your new account or clicking this link:</p>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <code className="text-sm flex-1 break-all">{ticketUrl}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Save this link to check your ticket status later, or log in to your new account to view your ticket.
              </p>
            </div>
            <div className="space-x-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  setFormData({
                    title: "",
                    firstMessage: "",
                    priority: TicketPriority.MEDIUM,
                    email: "",
                    password: "",
                    name: "",
                  });
                }}
              >
                Submit Another Ticket
              </Button>
              <Button onClick={() => window.location.href = ticketUrl}>
                View Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Submit a Support Ticket
          </h1>
          {currentUser && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as {currentUser.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          className="w-full mb-6"
          onClick={() => window.location.href = '/knowledge-base'}
        >
          Help yourself: Our knowledge base
        </Button>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!currentUser ? (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Email
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Create or enter your Password
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Choose a password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <div><strong>Name:</strong> {currentUser.name}</div>
                    <div><strong>Email:</strong> {currentUser.email}</div>
                    {currentUser.company && (
                      <div><strong>Company:</strong> {currentUser.company}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief summary of your issue"
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label
              htmlFor="firstMessage"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message
            </label>
            <textarea
              id="firstMessage"
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide as much detail as possible about your issue"
              value={formData.firstMessage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  firstMessage: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority
            </label>
            <select
              id="priority"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as TicketPriority,
                })
              }
            >
              <option value={TicketPriority.LOW}>Low - General inquiry or minor issue</option>
              <option value={TicketPriority.MEDIUM}>
                Medium - Issue affecting functionality
              </option>
              <option value={TicketPriority.HIGH}>High - Serious issue affecting work</option>
              <option value={TicketPriority.URGENT}>
                Urgent - Critical issue affecting business
              </option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              Our support team typically responds within 24 hours.
              {!formData.email && " Add your email to receive updates."}
            </p>
            <Button type="submit">
              Submit Ticket
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
