import React from "react";
import { useNavigate } from "react-router-dom";
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

const UploadSelection = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <header className="w-full p-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-sky-800">Upload Selection</h1>
        </div>
      </header>
      <main className="w-full h-full flex flex-row items-center justify-center p-20 space-x-20">
        <Section
          title="Upload Single File"
          description="Start with a single Python file. Option to skip specific classes or functions."
          onClick={() => navigate("/file-upload")}
        />
        <Section
          title="Upload Folder"
          description="Upload your project folder. Option to skip specific directories and files."
          onClick={() => navigate("/folder-upload")}
        />
        <Section
          title="Using a Repository"
          description="Paste a link to your GitHub repository. Option to choose a specific branch."
          onClick={() => navigate("/repo-upload")}
        />
      </main>
    </>
  );
};

export default UploadSelection;