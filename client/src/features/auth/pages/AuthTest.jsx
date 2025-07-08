import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';

const AuthTest = () => {
  const { currentUser, logout } = useAuth();

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
              onClick={logout}
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
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Backend Integration Status</h2>
        <p className="text-amber-500 font-medium">
          Waiting for backend integration. Authentication features are currently disabled.
        </p>
      </div>
    </div>
  );
};

export default AuthTest;