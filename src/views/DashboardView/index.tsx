import { useState, useEffect } from 'react';
import { getTickets } from '@/lib/api';
import { TicketStatus } from '@/types';

interface DashboardMetrics {
  openTickets: number;
  avgResponseTime: string;
  customerSatisfaction: string;
}

export function DashboardView() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    openTickets: 0,
    avgResponseTime: '0h',
    customerSatisfaction: '0%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const tickets = await getTickets();
        
        // Calculate open tickets
        const openTickets = tickets.filter(
          ticket => ticket.status === TicketStatus.OPEN || ticket.status === TicketStatus.IN_PROGRESS
        ).length;

        // Calculate average response time (simplified version)
        const avgResponseTime = tickets.reduce((acc, ticket) => {
          const firstResponse = ticket.conversation[0];
          if (!firstResponse) return acc;
          
          const responseTime = new Date(firstResponse.timestamp).getTime() - new Date(ticket.createdAt).getTime();
          return acc + responseTime;
        }, 0) / (tickets.length || 1);

        const avgResponseHours = Math.round(avgResponseTime / (1000 * 60 * 60) * 10) / 10;

        // Calculate customer satisfaction (simplified version)
        // In a real app, you would have a proper satisfaction rating system
        const resolvedTickets = tickets.filter(
          ticket => ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED
        ).length;
        const satisfactionRate = Math.round((resolvedTickets / (tickets.length || 1)) * 100);

        setMetrics({
          openTickets,
          avgResponseTime: `${avgResponseHours}h`,
          customerSatisfaction: `${satisfactionRate}%`
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // TODO: Add error handling UI
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Open Tickets", value: metrics.openTickets },
          { label: "Avg Response Time", value: metrics.avgResponseTime },
          { label: "Customer Satisfaction", value: metrics.customerSatisfaction }
        ].map(({ label, value }) => (
          <div key={label} className="border rounded-lg p-4">
            <h3 className="text-sm text-gray-500">{label}</h3>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
