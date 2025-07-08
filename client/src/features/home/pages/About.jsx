import React from "react";
import { useNavigate } from "react-router-dom";

const TeamMember = ({ name }) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center">
    <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl font-bold text-sky-700">
        {name.split(" ")[0][0]}
        {name.split(" ")[1][0]}
      </span>
    </div>
    <h3 className="text-xl font-semibold text-sky-700 mb-2">{name}</h3>
  </div>
);

const About = () => {
  const navigate = useNavigate();

  const teamMembers = [
    { name: "Al Sabeh, Fares R." },
    { name: "Bedaña, Lenin Marx Adolf O." },
    { name: "Macasindel, Ahmer Nassif O." },
    { name: "Villon, Gabriel Sigfred T." },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-sky-700 to-sky-900 text-white py-16 px-10">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold font-funnel-display mb-6">
            About Our Project
          </h1>
          <h2 className="text-2xl font-semibold mb-6 text-sky-100">
            Automated Python Codebase Documentation Generator
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Using NLP Techniques and Abstract Syntax Trees to automatically
            generate comprehensive documentation for Python codebases.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-funnel-display text-sky-800 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We aim to simplify Python documentation by combining Abstract Syntax
              Tree parsing with Natural Language Processing techniques, making it
              easier for developers to create comprehensive documentation for
              their codebases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-sky-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-sky-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-sky-700 mb-3">
                AST Analysis
              </h3>
              <p className="text-gray-600">
                Parse Python code structure using Abstract Syntax Trees.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-sky-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-sky-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-sky-700 mb-3">
                NLP Processing
              </h3>
              <p className="text-gray-600">
                Generate natural language documentation using NLP techniques.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-sky-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-sky-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-sky-700 mb-3">
                Automation
              </h3>
              <p className="text-gray-600">
                Streamline documentation generation for entire codebases.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-white py-16 px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-funnel-display text-sky-800 text-center mb-12">
            Technology Stack
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Frontend Technologies */}
            <div className="bg-sky-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-sky-700 mb-6 text-center">
                Frontend
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">React</span>
                  <span className="text-sm text-gray-600">UI Framework</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Tailwind CSS</span>
                  <span className="text-sm text-gray-600">Styling</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">ViteJS</span>
                  <span className="text-sm text-gray-600">
                    Development Environment
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Postman</span>
                  <span className="text-sm text-gray-600">API Testing</span>
                </div>
              </div>
            </div>

            {/* Backend Technologies */}
            <div className="bg-sky-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-sky-700 mb-6 text-center">
                Backend
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">FastAPI</span>
                  <span className="text-sm text-gray-600">Web Framework</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">MongoDB</span>
                  <span className="text-sm text-gray-600">Database</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">HuggingFace</span>
                  <span className="text-sm text-gray-600">Transformers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Python AST</span>
                  <span className="text-sm text-gray-600">Code Parsing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-funnel-display text-sky-800 text-center mb-12">
            Meet Our Team
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <TeamMember key={index} {...member} />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-10 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-funnel-display text-sky-800 text-center mb-12">
            Key Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-sky-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-sky-700 mb-4">
                AST-Based Analysis
              </h3>
              <p className="text-gray-600 mb-4">
                Parse Python code using Abstract Syntax Trees for accurate
                structure analysis.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Function and class detection</li>
                <li>• Parameter and type analysis</li>
                <li>• Code structure mapping</li>
              </ul>
            </div>

            <div className="bg-sky-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-sky-700 mb-4">
                NLP Documentation
              </h3>
              <p className="text-gray-600 mb-4">
                Generate human-readable documentation using Natural Language
                Processing.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Natural language descriptions</li>
                <li>• Context-aware explanations</li>
                <li>• Professional formatting</li>
              </ul>
            </div>

            <div className="bg-sky-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-sky-700 mb-4">
                HuggingFace Integration
              </h3>
              <p className="text-gray-600 mb-4">
                Leverage transformer models for intelligent documentation
                generation.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Pre-trained language models</li>
                <li>• Code understanding capabilities</li>
                <li>• Contextual documentation</li>
              </ul>
            </div>

            <div className="bg-sky-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-sky-700 mb-4">
                Multiple Export Formats
              </h3>
              <p className="text-gray-600 mb-4">
                Export generated documentation in various formats for different
                use cases.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• HTML for web publishing</li>
                <li>• Markdown for repositories</li>
                <li>• PDF for documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-sky-700 to-sky-900 text-white py-16 px-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Experience automated Python documentation generation with AST and NLP
            techniques.
          </p>
          <button
            className="text-xl px-8 py-4 bg-yellow-400 text-sky-800 rounded-lg font-medium
                     transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                     hover:shadow-lg"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;