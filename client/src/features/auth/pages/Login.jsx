import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/contexts/AuthContext";
import { notifyError, notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for userCreated parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("userCreated")) {
      setSuccessMessage("Account created successfully! Please sign in.");
    }
  }, [location]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!emailOrUsername || !password) {
      notifyError('Please enter both email and password');
      return;
    }

    const toastId = notifyLoading('Signing in...');

    try {
      setLoading(true);
      await login({ emailOrUsername, password, rememberMe });
      updateToast(toastId, 'success', 'Logged in successfully!');

      // Redirect to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Login failed. Please check your credentials.',
        showToast: false
      });

      updateToast(toastId, 'error', 
        error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col justify-center items-center w-full h-full font-funnel-sans space-y-10">
      <h1 className="text-[3rem] font-bold font-funnel-display text-sky-800">Welcome Back!</h1>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center space-y-5 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 border border-gray-400 p-6 md:p-10 rounded-2xl"
      >
        <div className="flex flex-col space-y-2 w-3/4">
          <input
            type="text"
            name="emailOrUsername"
            placeholder="Email or Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="p-2 border border-gray-600 rounded-lg w-full"
            required
          />
        </div>
        <div className="flex flex-col space-y-2 w-3/4">
          <label htmlFor="password">Password</label>
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 border border-gray-600 rounded-lg w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              tabIndex="-1"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 w-3/4">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </a>
          </div>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="bg-yellow-400 text-sky-700 w-1/3 p-2 rounded-lg
          transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
          hover:shadow-lg"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p>
          Don't have an account?{" "}
          <span>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </span>
        </p>
      </form>
    </section>
  );
};

export default Login;