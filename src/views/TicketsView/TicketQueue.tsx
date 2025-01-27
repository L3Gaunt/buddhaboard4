import { FC, useEffect, useState, useMemo } from 'react';
import { TicketQueueProps, AgentId, TicketStatus, TicketPriority } from '../../types';
import { getAgentProfile } from '../../lib/auth';
import { TicketBadge } from '../../components/TicketBadge';
import { TicketFiltersSection } from '../../components/FiltersSection';

// Helper function to get filters from URL parameters
const getFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);

  return {
    assignedTo: params.get('assignedTo')?.split(',').filter(Boolean) || [],
    status: (params.get('status')?.split(',').filter(Boolean) || []) as TicketStatus[],
    priority: (params.get('priority')?.split(',').filter(Boolean) || []) as TicketPriority[],
    searchQuery: params.get('search') || '',
  };
};

// Helper function to update URL parameters
const updateURLWithFilters = (filters: { 
  assignedTo: string[]; 
  status: TicketStatus[]; 
  priority: TicketPriority[]; 
}, searchQuery: string) => {
  const params = new URLSearchParams();
  if (filters.assignedTo.length) params.set('assignedTo', filters.assignedTo.join(','));
  if (filters.status.length) params.set('status', filters.status.join(','));
  if (filters.priority.length) params.set('priority', filters.priority.join(','));
  if (searchQuery) params.set('search', searchQuery);
  
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.pushState({}, '', newURL);
};

export const TicketQueue: FC<TicketQueueProps> = ({ tickets, setActiveTicket, isCustomerView = false, currentAgent }) => {
  // Clear active ticket when component mounts or when setActiveTicket changes
  useEffect(() => {
    setActiveTicket(null);
  }, [setActiveTicket]);

  const [agentNames, setAgentNames] = useState<Record<AgentId, string>>({});
  
  // Get stored filters and search query
  const savedFilters = getFiltersFromURL();
  const [searchQuery, setSearchQuery] = useState(savedFilters.searchQuery || "");
  
  // Initialize filters from URL or defaults
  const [filters, setFilters] = useState<{
    assignedTo: string[];
    status: TicketStatus[];
    priority: TicketPriority[];
  }>(() => ({
    assignedTo: isCustomerView ? [] : (savedFilters.assignedTo.length > 0 ? savedFilters.assignedTo : (currentAgent ? [currentAgent.id] : [])),
    status: isCustomerView ? [] : (savedFilters.status.length > 0 ? savedFilters.status : [TicketStatus.OPEN, TicketStatus.WAITING_AGENT_REPLY]),
    priority: isCustomerView ? [] : savedFilters.priority,
  }));

  // Update URL when filters or search query change
  useEffect(() => {
    if (!isCustomerView) {
      updateURLWithFilters(filters, searchQuery);
    }
  }, [filters, searchQuery, isCustomerView]);

  // Helper functions for colors
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Open': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Awaiting Reply': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-purple-100 text-purple-800',
      'Closed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Filter options
  const statusOptions = [
    { value: TicketStatus.OPEN, label: "Open" },
    { value: TicketStatus.WAITING_CUSTOMER_REPLY, label: "Waiting for Customer Reply" },
    { value: TicketStatus.WAITING_AGENT_REPLY, label: "Waiting for Agent Reply" },
    { value: TicketStatus.RESOLVED, label: "Resolved" },
    { value: TicketStatus.CLOSED, label: "Closed" },
  ];

  const priorityOptions = [
    { value: TicketPriority.LOW, label: "Low" },
    { value: TicketPriority.MEDIUM, label: "Medium" },
    { value: TicketPriority.HIGH, label: "High" },
    { value: TicketPriority.URGENT, label: "Urgent" },
  ];

  // Create agent options from the agentNames
  const agentOptions = useMemo(() => {
    return Object.entries(agentNames).map(([agentId, name]) => ({
      value: agentId,
      label: name === currentAgent?.name ? `${name} (Me)` : name,
    }));
  }, [agentNames, currentAgent]);

  useEffect(() => {
    // Fetch agent names for all assigned tickets
    const fetchAgentNames = async () => {
      const uniqueAgentIds = [...new Set(tickets
        .map(ticket => ticket.assignedTo)
        .filter((id): id is AgentId => id !== undefined))];

      const names: Record<AgentId, string> = {};
      for (const agentId of uniqueAgentIds) {
        try {
          const agent = await getAgentProfile(agentId);
          if (agent) {
            names[agentId] = agent.name;
          }
        } catch (error) {
          console.error(`Error fetching agent name for ${agentId}:`, error);
        }
      }
      setAgentNames(names);
    };

    fetchAgentNames();
  }, [tickets]);

  // Filter chips component
  const FilterChips: React.FC<{ type: string; values: string[] }> = ({ type, values }) => {
    if (values.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
          >
            {type === 'assignedTo' ? agentNames[value as AgentId] || 'Loading...' : value}
            <button
              onClick={() => {
                const newValues = filters[type as keyof typeof filters].filter(v => v !== value);
                setFilters({
                  ...filters,
                  [type]: newValues,
                });
              }}
              className="ml-1 hover:text-blue-900"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      assignedTo: [],
      status: [],
      priority: [],
    };
    setFilters(clearedFilters);
    setSearchQuery("");
  };

  // Filter tickets based on search and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.number.toString().includes(searchLower) ||
        ticket.conversation[0]?.message.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filters.status.length === 0 ||
        filters.status.includes(ticket.status);

      // Priority filter
      const matchesPriority = filters.priority.length === 0 ||
        filters.priority.includes(ticket.priority);

      // Assigned to filter
      const matchesAssigned = filters.assignedTo.length === 0 ||
        (ticket.assignedTo && filters.assignedTo.includes(ticket.assignedTo));

      return matchesSearch && matchesStatus && matchesPriority && matchesAssigned;
    });
  }, [tickets, searchQuery, filters]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{isCustomerView ? "My Tickets" : "Ticket Queue"}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {filteredTickets.length} tickets
          </span>
        </div>
      </div>

      {!isCustomerView && (
        <TicketFiltersSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          agentOptions={agentOptions}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          FilterChips={FilterChips}
        />
      )}

      {isCustomerView && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="space-y-4 overflow-auto">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              const newUrl = `/tickets/${ticket.number}`;
              window.history.pushState({}, '', newUrl);
              setActiveTicket(ticket);
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                {ticket.conversation[0] && (
                  <p className="text-sm text-gray-500">{ticket.conversation[0].message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <TicketBadge type="status" value={ticket.status} />
                <TicketBadge type="priority" value={ticket.priority} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Ticket #{ticket.number}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(ticket.createdAt)}</span>
              {ticket.assignedTo && !isCustomerView && (
                <>
                  <span className="mx-2">•</span>
                  <span>Assigned to: {agentNames[ticket.assignedTo] || 'Loading...'}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
