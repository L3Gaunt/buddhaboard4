import { FC, useEffect, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { TicketBadge } from '../../components/TicketBadge';
import { TicketFiltersSection } from '../../components/FiltersSection';
import { getAgentProfile } from '../../lib/auth';
import { AgentId, TicketStatus, TicketPriority } from '../../types';

interface FeedbackQueueProps {
  feedbackItems: Array<{
    id: string;
    ticketNumber: number;
    rating: number;
    feedbackText: string | null;
    createdAt: Date;
    ticket: {
      title: string;
      assignedTo: string | null;
      status: TicketStatus;
      priority: TicketPriority;
    };
  }>;
  setActiveTicket: (ticketNumber: number) => void;
  currentAgent?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export const FeedbackQueue: FC<FeedbackQueueProps> = ({ feedbackItems, setActiveTicket, currentAgent }) => {
  const [agentNames, setAgentNames] = useState<Record<AgentId, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    assignedTo: string[];
    rating: string[];
  }>({
    assignedTo: currentAgent ? [currentAgent.id] : [],
    rating: [],
  });

  // Rating options for filtering
  const ratingOptions = [
    { value: "1", label: "1 Star" },
    { value: "2", label: "2 Stars" },
    { value: "3", label: "3 Stars" },
    { value: "4", label: "4 Stars" },
    { value: "5", label: "5 Stars" },
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
      const uniqueAgentIds = [...new Set(feedbackItems
        .map(item => item.ticket.assignedTo)
        .filter((id): id is AgentId => id !== null))];

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
  }, [feedbackItems]);

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
            {type === 'assignedTo' && value in agentNames ? agentNames[value as AgentId] : `${value} Star${value !== '1' ? 's' : ''}`}
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
      rating: [],
    });
    setSearchQuery("");
  };

  // Filter feedback items based on search and filters
  const filteredFeedback = useMemo(() => {
    return feedbackItems.filter((item) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        item.ticket.title.toLowerCase().includes(searchLower) ||
        item.ticketNumber.toString().includes(searchLower) ||
        (item.feedbackText && item.feedbackText.toLowerCase().includes(searchLower));

      // Rating filter
      const matchesRating = filters.rating.length === 0 ||
        filters.rating.includes(item.rating.toString());

      // Assigned to filter
      const matchesAssigned = filters.assignedTo.length === 0 ||
        (item.ticket.assignedTo && filters.assignedTo.includes(item.ticket.assignedTo));

      return matchesSearch && matchesRating && matchesAssigned;
    });
  }, [feedbackItems, searchQuery, filters]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const handleTicketClick = (ticketNumber: number) => {
    const newUrl = `/tickets/${ticketNumber}`;
    window.history.pushState({}, '', newUrl);
    setActiveTicket(ticketNumber);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Customer Feedback</h2>
        <span className="text-sm text-gray-500">
          {filteredFeedback.length} feedback items
        </span>
      </div>

      <TicketFiltersSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        ratingOptions={ratingOptions}
        agentOptions={agentOptions}
        getStatusColor={() => ""}
        getPriorityColor={() => ""}
        FilterChips={FilterChips}
      />

      <div className="space-y-4">
        {filteredFeedback.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => handleTicketClick(item.ticketNumber)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{item.ticket.title}</h3>
                {item.feedbackText && (
                  <p className="text-sm text-gray-500 mt-1">{item.feedbackText}</p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= item.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <TicketBadge type="status" value={item.ticket.status} />
                <TicketBadge type="priority" value={item.ticket.priority} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Ticket #{item.ticketNumber}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(item.createdAt)}</span>
              {item.ticket.assignedTo && (
                <>
                  <span className="mx-2">•</span>
                  <span>Assigned to: {item.ticket.assignedTo in agentNames ? agentNames[item.ticket.assignedTo as AgentId] : 'Loading...'}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 