import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { notifyError, notifyLoading, updateToast } from '../../../shared/utils/toast';
import { handleApiError } from '../../../shared/utils/errorHandler';

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUppercase: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const password = formData.password;
    
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
    });
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all password requirements are met
    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
    
    if (!allRequirementsMet) {
      setError("Please ensure your password meets all requirements");
      return;
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Add password requirements validation
    if (formData.password.length < 8) {
      notifyError('Password must be at least 8 characters');
      return;
    }
    
    // Check for at least one uppercase, one lowercase and one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(formData.password)) {
      notifyError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }
    
    const toastId = notifyLoading('Creating your account...');
    
    try {
      setLoading(true);
      await authAPI.register(formData);
      
      updateToast(toastId, 'success', 'Account created successfully!');
      
      // Redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      handleApiError(error, {
        defaultMessage: 'Failed to create account',
        showToast: false
      });
      updateToast(toastId, 'error', 
        error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  
  // Update GitHub register function for future implementation
  const handleGitHubRegister = () => {
    setError("GitHub authentication waiting for backend integration");
    // Will be implemented when backend is ready
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className="flex items-center">
      <div className={`flex-shrink-0 h-4 w-4 rounded-full ${met ? 'bg-green-500' : 'bg-gray-200'} mr-2`}>
        {met && (
          <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>{text}</span>
    </div>
  );

  return (
    <section className="flex flex-col justify-center items-center w-full h-full font-funnel-sans space-y-10">
      <h1 className="text-[3rem] font-bold font-funnel-display text-sky-800">Create an Account</h1>
      
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center space-y-5 w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/4 border border-gray-400 p-6 md:p-10 rounded-2xl"
      >
        {/* Username field */}
        <div className="flex flex-col space-y-2 w-3/4">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            name="username"
            id="username"
            value={formData.username}
            onChange={handleChange}
            className="p-2 border border-gray-600 rounded-lg w-full"
            required
          />
        </div>
        
        {/* Email field */}
        <div className="flex flex-col space-y-2 w-3/4">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="p-2 border border-gray-600 rounded-lg w-full"
            required
          />
        </div>
        
        {/* Password field */}
        <div className="flex flex-col space-y-2 w-3/4">
          <label htmlFor="password">Password</label>
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="p-2 border border-gray-600 rounded-lg w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("password")}
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
          {formData.password.length > 0 && (
            <div className="mt-2 space-y-1 bg-gray-50 p-3 rounded-md border border-gray-200">
              <PasswordRequirement 
                met={passwordRequirements.minLength} 
                text="At least 8 characters" 
              />
              <PasswordRequirement 
                met={passwordRequirements.hasUppercase} 
                text="At least 1 uppercase letter" 
              />
              <PasswordRequirement 
                met={passwordRequirements.hasNumber} 
                text="At least 1 number" 
              />
              <PasswordRequirement 
                met={passwordRequirements.hasSpecial} 
                text="At least 1 special character" 
              />
            </div>
          )}
        </div>
        
        {/* Confirm Password field */}
        <div className="flex flex-col space-y-2 w-3/4">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="relative w-full">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="p-2 border border-gray-600 rounded-lg w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              tabIndex="-1"
            >
              {showConfirmPassword ? (
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
          {formData.confirmPassword && (
            <div className={`text-sm ${
              formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'
            }`}>
              {formData.password === formData.confirmPassword 
                ? 'Passwords match' 
                : 'Passwords do not match'}
            </div>
          )}
        </div>
        
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md w-3/4 text-center">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="bg-yellow-400 text-sky-700 w-1/3 p-2 rounded-lg
          transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
          hover:shadow-lg"
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <div className="flex items-center w-3/4 my-2">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="mx-4 text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* GitHub authentication button */}
        <button
          type="button"
          className="flex items-center justify-center space-x-2 w-3/4 p-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          onClick={handleGitHubRegister}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Register with GitHub</span>
        </button>

        <p>
          Already have an account?{" "}
          <span>
            <Link to="/login" className="hover:underline">
              Log In
            </Link>
          </span>
        </p>
      </form>
    </section>
  );
};

export default Register;