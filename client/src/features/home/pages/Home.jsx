import React from "react";
import PythonLogo from "../../../assets/python_logo.svg";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-row items-center justify-center min-h-[80vh] pb-0">
        <section className="flex flex-col items-center justify-center w-1/2 p-20 font-funnel-sans space-y-10">
          <h1 className="text-[6rem] font-extrabold leading-tight font-funnel-display text-sky-700">
            Documentation, <br /> Made Easier.
          </h1>
          <p className="text-[1.5rem] text-center w-3/4">
            Seamlessly create documentation for your Python code using our
            AI-driven tool.
          </p>
          <button
            className="text-[1.5rem] p-3 bg-yellow-400 text-sky-700 rounded-lg font-medium 
                       transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                       hover:shadow-lg"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </section>
        <section className="flex items-center justify-center w-1/2 p-20">
          <img src={PythonLogo} alt="Python Logo" className="max-w-lg" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="bg-sky-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-sky-700">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-sky-700">Upload Your Code</h3>
              <p className="text-lg text-gray-600">Simply upload your Python files or project folders through our intuitive interface.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-sky-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-sky-700">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-sky-700">Review Analysis</h3>
              <p className="text-lg text-gray-600">Our system analyzes your code structure and identifies all components that need documentation.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-sky-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-sky-700">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-sky-700">Generate Documentation</h3>
              <p className="text-lg text-gray-600">Generate comprehensive documentation with a single click and export in your preferred format.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-12 px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-funnel-display text-sky-800 text-center mb-10">Why Choose Our Tool?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-sky-700">Time-Saving</h3>
              <p className="text-gray-600">Automatically generate documentation instead of writing it manually, saving hours of work.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-sky-700">Consistent Format</h3>
              <p className="text-gray-600">Ensure all your documentation follows the same professional format and style.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-sky-700">Easy to Use</h3>
              <p className="text-gray-600">Simple interface that requires no technical expertise to generate professional documentation.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-sky-700">Multiple Formats</h3>
              <p className="text-gray-600">Export your documentation in HTML, Markdown, or PDF formats to suit your needs.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-sky-700 text-white py-12 px-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to simplify your documentation?</h2>
          <p className="text-xl mb-8">Join developers who are saving time with our documentation tool.</p>
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