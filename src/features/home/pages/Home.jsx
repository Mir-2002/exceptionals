import React from "react";
import PythonLogo from "../../../assets/python_logo.svg";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-center min-h-[80vh] pb-0">
        <section className="flex flex-col items-center md:items-start justify-center w-full md:w-1/2 p-4 md:p-10 lg:p-20 font-funnel-sans space-y-6 md:space-y-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] xl:text-[6rem] font-extrabold leading-tight font-funnel-display text-sky-700 text-center md:text-left">
            Documentation, <br className="hidden md:block" /> Made Easier.
          </h1>
          <p className="text-lg md:text-xl lg:text-[1.5rem] text-center md:text-left w-full md:w-3/4">
            Seamlessly create documentation for your Python code using our
            AI-driven tool.
          </p>
          <button
            className="text-lg md:text-xl p-3 bg-yellow-400 text-sky-700 rounded-lg font-medium 
                       transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                       hover:shadow-lg"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </section>
        <section className="flex items-center justify-center w-full md:w-1/2 p-4 md:p-10 lg:p-20">
          <img src={PythonLogo} alt="Python Logo" className="w-full max-w-[300px] md:max-w-lg" />
        </section>
      </div>

      <div className="bg-gray-50 py-12 px-10 -mt-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-funnel-display text-sky-800 text-center mb-10">Key Features</h2>
          <div className="grid grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-sky-700">Smart Code Analysis</h3>
              <p>Our tool analyzes your Python code and identifies functions, classes, and methods automatically.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-sky-700">Docstring Generation</h3>
              <p>Generate comprehensive docstrings for your functions and classes with a single click.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-sky-700">Export Options</h3>
              <p>Export your documentation in multiple formats including HTML, Markdown, and PDF.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-funnel-display text-sky-800 text-center mb-10">How It Works</h2>
          <div className="flex flex-col space-y-10">
            <div className="flex items-center">
              <div className="w-1/2 pr-10">
                <h3 className="text-3xl font-semibold mb-4">1. Upload Your Code</h3>
                <p className="text-lg">Simply upload your Python files through our intuitive interface.</p>
              </div>
              <div className="w-1/2">
                {/* Placeholder for an illustration */}
                <div className="bg-gray-200 h-64 rounded-lg"></div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-1/2">
                {/* Placeholder for an illustration */}
                <div className="bg-gray-200 h-64 rounded-lg"></div>
              </div>
              <div className="w-1/2 pl-10">
                <h3 className="text-3xl font-semibold mb-4">2. Review Analysis</h3>
                <p className="text-lg">Our system analyzes your code and identifies all components that need documentation.</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-1/2 pr-10">
                <h3 className="text-3xl font-semibold mb-4">3. Generate Documentation</h3>
                <p className="text-lg">Generate comprehensive documentation with a single click and export in your preferred format.</p>
              </div>
              <div className="w-1/2">
                {/* Placeholder for an illustration */}
                <div className="bg-gray-200 h-64 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-sky-700 text-white py-12 px-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to simplify your documentation?</h2>
          <p className="text-xl mb-8">Join thousands of developers who are saving time with our documentation tool.</p>
          <button 
            className="text-xl px-8 py-4 bg-yellow-400 text-sky-800 rounded-lg font-medium
                     transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                     hover:shadow-lg"
            onClick={() => navigate("/register")}
          >
            Get Started for Free
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;