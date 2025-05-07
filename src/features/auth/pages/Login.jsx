import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/contexts/AuthContext"; 

const Input = ({ type, name, id, label, value, onChange, required }) => {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        className="p-2 border border-gray-600 rounded-lg"
        required={required}
      />
    </>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); // Make sure this matches your mock auth context

  // Check for userCreated parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("userCreated") === "true") {
      setSuccessMessage("Account created successfully! Please log in.");
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      
      // Mock login for UI testing
      console.log("Mock login with:", formData.email);
      
      // Simulate login delay
      setTimeout(() => {
        // Call the mock login function from your context
        login(formData.email);
        setLoading(false);
        navigate("/dashboard");
      }, 800);
      
    } catch (error) {
      setError("Failed to log in");
      setLoading(false);
    }
  };

  return (
    <>
      <section className="flex flex-col justify-center items-center w-full h-full font-funnel-sans space-y-10">
        <h1 className="text-[3rem] font-bold font-funnel-display text-sky-800">Welcome Back!</h1>
        
        {/* Success message from registration */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center items-center space-y-5 w-1/4 h-3/5 border border-gray-400 p-15 rounded-2xl"
        >
          <div className="flex flex-col space-y-2 w-3/4">
            <Input
              type="email"
              name="email"
              id="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col space-y-2 w-3/4">
            <Input
              type="password"
              name="password"
              id="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <a href="">Forgot Password?</a>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="bg-yellow-400 text-sky-700 w-1/3 p-2 rounded-lg
            transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                       hover:shadow-lg"
            disabled={loading}
          >
            Sign In
          </button>

          <div className="flex items-center w-3/4 my-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="mx-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* GitHub authentication button - just UI for now */}
          <button
            type="button"
            className="flex items-center justify-center space-x-2 w-3/4 p-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            onClick={() => console.log("GitHub login - to be implemented")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>Continue with GitHub</span>
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
    </>
  );
};

export default Login;
