import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="flex flex-col sm:flex-row items-center justify-between w-full h-full px-4 sm:px-10 md:px-20 py-3 md:py-5 bg-sky-800 text-white">
        <div className="flex flex-row items-center justify-center sm:justify-start w-full sm:w-1/2 mb-4 sm:mb-0">
          <Link to="/">
            <h1 className="text-2xl md:text-3xl lg:text-[3rem] font-bold font-funnel-display">
              Exceptionals
            </h1>
          </Link>
        </div>
        <nav className="flex flex-row items-center justify-center sm:justify-end w-full sm:w-1/2">
          <ul className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-between space-x-2 sm:space-x-4 md:space-x-10 font-work-sans text-base md:text-lg">
            {currentUser && (
              <li>
                <p>Welcome, {currentUser.username}</p>
              </li>
            )}
            <li>
              <Link to="/dashboard" className="hover:text-gray-200 transition-colors">Dashboard</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-gray-200 transition-colors">About Us</Link>
            </li>
            
            {!currentUser ? (
              <>
                <li><Link to="/login">Log In</Link></li>
                <li><Link to="/register" className="...">Sign Up</Link></li>
              </>
            ) : (
              <li>
                <button onClick={handleLogout} className="...">Logout</button>
              </li>
            )}
          </ul>
        </nav>
      </header>
    </>
  );
};

export default Header;
