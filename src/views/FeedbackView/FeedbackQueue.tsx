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

// Helper function to get filters from URL parameters and localStorage
const getFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const storedFilters = localStorage.getItem('feedbackFilters');
  const parsedStoredFilters = storedFilters ? JSON.parse(storedFilters) : null;

  return {
    assignedTo: params.get('assignedTo')?.split(',').filter(Boolean) || 
                parsedStoredFilters?.assignedTo || [],
    rating: params.get('rating')?.split(',').filter(Boolean) || 
            parsedStoredFilters?.rating || [],
    searchQuery: params.get('search') || 
                parsedStoredFilters?.searchQuery || '',
  };
};

// Helper function to update URL parameters and localStorage with current filters
const updateURLWithFilters = (filters: { assignedTo: string[]; rating: string[]; }, searchQuery: string) => {
  const params = new URLSearchParams();
  if (filters.assignedTo.length) params.set('assignedTo', filters.assignedTo.join(','));
  if (filters.rating.length) params.set('rating', filters.rating.join(','));
  if (searchQuery) params.set('search', searchQuery);
  
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.pushState({}, '', newURL);

  // Store in localStorage
  localStorage.setItem('feedbackFilters', JSON.stringify({
    ...filters,
    searchQuery
  }));
};

export const FeedbackQueue: FC<FeedbackQueueProps> = ({ feedbackItems, setActiveTicket, currentAgent }) => {
  const [agentNames, setAgentNames] = useState<Record<AgentId, string>>(() => {
    // Initialize with current agent's name if available
    if (currentAgent) {
      return { [currentAgent.id]: currentAgent.name };
    }
    return {};
  });

  // Get stored filters and search query
  const savedFilters = getFiltersFromURL();
  const [searchQuery, setSearchQuery] = useState(savedFilters.searchQuery);
  const [filters, setFilters] = useState<{
    assignedTo: string[];
    rating: string[];
  }>(() => ({
    assignedTo: savedFilters.assignedTo,
    rating: savedFilters.rating,
  }));

  // Update URL and localStorage when filters or search query change
  useEffect(() => {
    updateURLWithFilters(filters, searchQuery);
  }, [filters, searchQuery]);

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
        .filter((id): id is AgentId => id !== null))]
        .filter(id => !(id in agentNames)); // Only fetch names we don't already have

      if (uniqueAgentIds.length === 0) return; // Skip if no new agents to fetch

      const names: Record<AgentId, string> = { ...agentNames };
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
  }, [feedbackItems, agentNames]);

  // Filter chips component
  const FilterChips: React.FC<{ type: string; values: string[] }> = ({ type, values }) => {
    if (values.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          let displayText = value;
          if (type === 'assignedTo') {
            displayText = value in agentNames ? agentNames[value as AgentId] : 'Loading...';
          } else {
            displayText = `${value} Star${value !== '1' ? 's' : ''}`;
          }
          return (
            <span
              key={value}
              className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
            >
              {displayText}
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
          );
        })}
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
    localStorage.removeItem('feedbackFilters');
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
        <div className="text-sm text-gray-500 flex items-center gap-4">
          {filteredFeedback.length > 0 && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              <span>
                {(filteredFeedback.reduce((acc, item) => acc + item.rating, 0) / filteredFeedback.length).toFixed(1)} avg
              </span>
            </div>
          )}
          <span>{filteredFeedback.length} feedback items</span>
        </div>
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