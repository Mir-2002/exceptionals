import React from 'react';
import { Link } from 'react-router-dom';
import { mockUsers } from '../../../shared/services/mockAuth';

const AuthTest = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [registeredUsers, setRegisteredUsers] = React.useState([]);

  React.useEffect(() => {
    // Get user from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    
    // Get mock users for debugging
    setRegisteredUsers(mockUsers || []);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    window.location.reload();
  };

  const loginWithTestAccount = () => {
    const testUser = {
      id: 'test-user',
      username: 'testuser',
      email: 'test@example.com'
    };
    
    localStorage.setItem('user', JSON.stringify(testUser));
    localStorage.setItem('token', 'mock-token-' + Math.random().toString(36).substring(2));
    setCurrentUser(testUser);
  };

  const resetMockAuth = () => {
    // Clear user data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Reset mock users to just the default account
    const defaultUser = { 
      id: 'default-1', 
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    };
    
    localStorage.setItem('mockUsers', JSON.stringify([defaultUser]));
    
    // Reload the page to refresh state
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
        {currentUser ? (
          <div className="bg-green-100 rounded p-4 border border-green-200">
            <p className="font-medium text-green-700">Logged In Successfully ✅</p>
            <div className="mt-2 space-y-1">
              <p><span className="font-medium">Username:</span> {currentUser.username}</p>
              <p><span className="font-medium">Email:</span> {currentUser.email}</p>
              <p><span className="font-medium">ID:</span> {currentUser.id}</p>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="bg-yellow-100 rounded p-4 border border-yellow-200">
            <p className="font-medium text-yellow-700">Not Logged In ❌</p>
            <div className="mt-4 flex space-x-4">
              <Link to="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Go to Login
              </Link>
              <Link to="/register" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Go to Register
              </Link>
              <button 
                onClick={loginWithTestAccount}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Quick Login (Test Account)
              </button>
              <button 
                onClick={resetMockAuth}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Reset Mock Auth (Restore Default Account)
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Mock User Database</h2>
        {registeredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">ID</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Username</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="py-2 px-4 border-b border-gray-200">{user.id}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{user.username}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No users registered yet</p>
        )}
      </div>
    </div>
  );
};

export default AuthTest;