import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../../../shared/contexts/AuthContext';

const Section = ({ title, description, onClick }) => {
  return (
    <section
      className="flex flex-col items-center justify-center w-1/5 h-3/5 border border-gray-400 rounded-2xl font-funnel-sans hover:bg-gray-200 hover:scale-105 transition-all duration-100 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-between w-full h-1/2 p-10">
        <h2 className="text-[1.5rem] font-semibold font-funnel-display text-sky-700">
          {title}
        </h2>
        <p className="w-3/4 text-base text-center">
          {description}
        </p>
      </div>
    </section>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Get user from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-sky-800">Dashboard</h1>
      
      {user ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.username}!</h2>
          <p>You are logged in as: {user.email}</p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-sky-700">Recent Projects</h3>
              <p className="text-gray-600 mt-2">You have no recent projects.</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-sky-700">Upload Code</h3>
              <p className="text-gray-600 mt-2">Upload your code for documentation.</p>
              <Link 
                to="/file-upload" 
                className="mt-4 inline-block px-4 py-2 bg-yellow-400 text-sky-700 rounded hover:bg-yellow-500"
              >
                Go to Upload
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>You need to be logged in to view this page.</p>
          <Link to="/login" className="font-medium underline">Sign in here</Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
