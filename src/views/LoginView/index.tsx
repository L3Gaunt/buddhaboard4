import { useState } from 'react';
import { signIn, getAgentProfile } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting to sign in with:', { email });
      const result = await signIn(email, password);
      console.log('Sign in result:', result);
      
      if (result.user) {
        // First check if this email exists in the agents table without fetching the full profile
        const { count, error: countError } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })
          .eq('email', email);
        
        if (countError) {
          console.error('Error checking agent status:', countError);
        }
        
        // Only try to get agent profile if the email exists in agents table
        if (count && count > 0) {
          const agentProfile = await getAgentProfile(result.user.id);
          if (agentProfile) {
            window.location.reload();
            return;
          }
        }
        
        // If not an agent or error occurred, proceed as customer
        window.location.href = '/customer';
      }
    } catch (err) {
      console.error('Detailed login error:', err);
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Support Desk Login</h1>
        {error && (
          <div className="bg-red-50 text-red-800 rounded-md p-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setShowSecret(!showSecret)}
          >
            psst
          </Button>
          {showSecret && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">
              Hey there, curious one! 👋 admin@buddhaboard.com, n1rvana
            </p>
          )}
        </form>
        <div className="mt-6 text-center border-t pt-6">
          <p className="text-sm text-gray-600">
            Need help? {' '}
            <a 
              href="/submit-ticket" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Submit your first Support Ticket
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 