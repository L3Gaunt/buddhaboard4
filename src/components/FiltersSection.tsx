import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterDropdown } from "../views/TicketsView/FilterDropdown";

interface TicketFiltersSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: {
    assignedTo: string[];
    status: string[];
    priority: string[];
  };
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  statusOptions: Array<{
    value: string;
    label: string;
  }>;
  priorityOptions: Array<{
    value: string;
    label: string;
  }>;
  agentOptions: Array<{
    value: string;
    label: string;
  }>;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  FilterChips: React.ComponentType<{
    type: string;
    values: string[];
  }>;
}

export function TicketFiltersSection({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  clearFilters,
  statusOptions,
  priorityOptions,
  agentOptions,
  getStatusColor,
  getPriorityColor,
  FilterChips,
}: TicketFiltersSectionProps) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search tickets by title, description, or number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FilterDropdown
          label="Status"
          options={statusOptions}
          selected={filters.status}
          onChange={(values: string[]) =>
            setFilters({
              ...filters,
              status: values,
            })
          }
          getOptionColor={getStatusColor}
        />
        <FilterDropdown
          label="Priority"
          options={priorityOptions}
          selected={filters.priority}
          onChange={(values: string[]) =>
            setFilters({
              ...filters,
              priority: values,
            })
          }
          getOptionColor={getPriorityColor}
        />
        <FilterDropdown
          label="Assigned To"
          options={agentOptions}
          selected={filters.assignedTo}
          onChange={(values: string[]) =>
            setFilters({
              ...filters,
              assignedTo: values,
            })
          }
          getOptionColor={() => "bg-gray-100 text-gray-800"}
          searchable={true}
        />
      </div>
      {(searchQuery ||
        filters.assignedTo.length > 0 ||
        filters.status.length > 0 ||
        filters.priority.length > 0) && (
        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Active Filters:
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="space-y-1">
            <FilterChips type="assignedTo" values={filters.assignedTo} />
            <FilterChips type="status" values={filters.status} />
            <FilterChips type="priority" values={filters.priority} />
          </div>
        </div>
      )}
    </div>
  );
}
