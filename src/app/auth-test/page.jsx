'use client';

import { useAuth } from '@/hooks/auth.jsx';
import { useEffect, useState } from 'react';
import axios from '@/lib/axios';

export default function AuthTest() {
  const { user } = useAuth();
  const [apiTests, setApiTests] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const tests = {};
      
      try {
        // Test 1: Check if user is authenticated
        const userResponse = await axios.get('/api/user');
        tests.userAuth = { 
          status: 'success', 
          data: userResponse.data,
          message: 'User authenticated successfully'
        };
      } catch (error) {
        tests.userAuth = { 
          status: 'error', 
          error: error.response?.status,
          message: error.response?.data?.message || 'User authentication failed'
        };
      }

      try {
        // Test 2: Check owner birthcare
        const birthcareResponse = await axios.get('/api/owner/birthcare');
        tests.ownerBirthcare = { 
          status: 'success', 
          data: birthcareResponse.data,
          message: 'Owner birthcare found'
        };
      } catch (error) {
        tests.ownerBirthcare = { 
          status: 'error', 
          error: error.response?.status,
          message: error.response?.data?.message || 'Owner birthcare check failed'
        };
      }

      try {
        // Test 3: Check dashboard API
        const dashboardResponse = await axios.get('/api/owner/dashboard/statistics');
        tests.dashboard = { 
          status: 'success', 
          data: dashboardResponse.data,
          message: 'Dashboard API working'
        };
      } catch (error) {
        tests.dashboard = { 
          status: 'error', 
          error: error.response?.status,
          message: error.response?.data?.message || 'Dashboard API failed'
        };
      }

      setApiTests(tests);
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return <div className="p-8">Running authentication tests...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication & API Tests</h1>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Frontend User Hook</h2>
          <p className="text-sm text-gray-600 mb-2">User from useAuth hook:</p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {Object.entries(apiTests).map(([testName, result]) => (
          <div key={testName} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h2>
              <span className={`px-2 py-1 rounded text-xs ${
                result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.status}
              </span>
              {result.error && (
                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                  HTTP {result.error}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{result.message}</p>
            {result.data && (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Next Steps:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• If "User Auth" fails: You need to log in first</li>
          <li>• If "Owner Birthcare" fails: You need to register a birthcare facility</li>
          <li>• If "Dashboard" fails: Check the owner birthcare registration and approval status</li>
        </ul>
      </div>
    </div>
  );
}