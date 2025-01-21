import React, { useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
export function UserTicketView() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Submitting ticket:", formData);
    setShowSuccess(true);
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
            <Button
              onClick={() => {
                setShowSuccess(false);
                setFormData({
                  title: "",
                  description: "",
                  priority: "Medium",
                });
              }}
            >
              Submit Another Ticket
            </Button>
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
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide as much detail as possible about your issue"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
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
                  priority: e.target.value,
                })
              }
            >
              <option value="Low">Low - General inquiry or minor issue</option>
              <option value="Medium">
                Medium - Issue affecting functionality
              </option>
              <option value="High">High - Serious issue affecting work</option>
              <option value="Urgent">
                Urgent - Critical issue affecting business
              </option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              Our support team typically responds within 24 hours.
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
