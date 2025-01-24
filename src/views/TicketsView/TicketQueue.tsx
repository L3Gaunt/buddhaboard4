import { FC, useEffect, useState, useMemo } from 'react';
import { TicketQueueProps, AgentId, TicketStatus, TicketPriority } from '../../types';
import { getAgentProfile } from '../../lib/auth';
import { TicketBadge } from '../../components/TicketBadge';
import { TicketFiltersSection } from '../../components/FiltersSection';

export const TicketQueue: FC<TicketQueueProps> = ({ tickets, setActiveTicket, isCustomerView = false, currentAgent }) => {
  const [agentNames, setAgentNames] = useState<Record<AgentId, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    assignedTo: string[];
    status: string[];
    priority: string[];
  }>({
    assignedTo: currentAgent ? [currentAgent.id] : [],
    status: ["open"],
    priority: [],
  });

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
    setFilters({
      assignedTo: [],
      status: [],
      priority: [],
    });
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{isCustomerView ? "My Tickets" : "Ticket Queue"}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {filteredTickets.length} tickets
          </span>
          <button
            onClick={() => window.location.href = '/submit-ticket'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Submit New Ticket
          </button>
        </div>
      </div>

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

      <div className="space-y-4">
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
