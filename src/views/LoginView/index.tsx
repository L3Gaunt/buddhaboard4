import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth';
import { Button } from "@/components/ui/button";

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting to sign in with:', { email });
      const result = await signIn(email, password);
      console.log('Sign in result:', result);
    } catch (err) {
      console.error('Detailed login error:', err);
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestAgent = async () => {
    try {
      setLoading(true);
      const result = await signUp({
        email: 'agent1@buddhaboard.com',
        password: 'password123',
        name: 'Sarah Johnson',
        role: 'agent'
      });
      console.log('Created test agent:', result);
      setError('Test agent created successfully! You can now log in.');
    } catch (err) {
      console.error('Error creating test agent:', err);
      setError(err instanceof Error ? err.message : 'Error creating test agent');
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
        </form>
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreateTestAgent}
            disabled={loading}
          >
            Create Test Agent
          </Button>
        </div>
      </div>
    </div>
  );
} 