import React, { useState } from "react";
import Header from "../../../components/Header";
import Card from "../../../components/Card";
import { Link } from "react-router-dom";

// Local reusable component for file actions
const FileActions = ({ onView, onDownload, onDelete }) => (
  <div className="flex flex-row gap-x-2 mt-2">
    <button
      className="bg-blue-500 text-white px-3 py-1 rounded font-medium"
      onClick={onView}
    >
      View
    </button>
    <button
      className="bg-green-500 text-white px-3 py-1 rounded font-medium"
      onClick={onDownload}
    >
      Download
    </button>
    <button
      className="bg-red-500 text-white px-3 py-1 rounded font-medium"
      onClick={onDelete}
    >
      Delete
    </button>
  </div>
);

// Local reusable component for a file card
const FileCard = ({
  name,
  project,
  uploadedAt,
  onView,
  onDownload,
  onDelete,
}) => (
  <Card
    title={name}
    description={
      <div>
        <div className="text-sm text-gray-600">Project: {project}</div>
        <div className="text-xs text-gray-400">Uploaded: {uploadedAt}</div>
      </div>
    }
  >
    <FileActions onView={onView} onDownload={onDownload} onDelete={onDelete} />
  </Card>
);

const Files = () => {
  // Example file data (replace with API call)
  const [files] = useState([
    {
      id: 1,
      name: "main.py",
      project: "Project 1",
      uploadedAt: "2024-07-09",
    },
    {
      id: 2,
      name: "utils.py",
      project: "Project 2",
      uploadedAt: "2024-07-08",
    },
    {
      id: 3,
      name: "formatting.py",
      project: "Project 1",
      uploadedAt: "2024-07-07",
    },
  ]);

  // Example handlers
  const handleView = (id) => {
    console.log("View", id);
  };
  const handleDownload = (id) => {
    console.log("Download", id);
  };
  const handleDelete = (id) => {
    console.log("Delete", id);
  };

  return (
    <main className="w-screen h-screen flex flex-col items-center">
      <section className="w-3/4">
        <Header />
      </section>
      <section className="flex flex-1 w-full flex-col items-center justify-center gap-8 bg-gray-200">
        <button className="text-2xl text-blue-500 bg-white px-5 py-3 rounded-2xl border-2 font-medium">
          Upload a File
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-3/4">
          {files.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500">
              No files uploaded yet.
            </div>
          ) : (
            files.map((file) => (
              <FileCard
                key={file.id}
                name={file.name}
                project={file.project}
                uploadedAt={file.uploadedAt}
                onView={() => handleView(file.id)}
                onDownload={() => handleDownload(file.id)}
                onDelete={() => handleDelete(file.id)}
              />
            ))
          )}
        </div>
        <Link to="/dashboard" className="hover:underline">
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
};

export default Files;
