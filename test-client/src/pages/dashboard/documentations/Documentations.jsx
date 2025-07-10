import React, { useState } from "react";
import Header from "../../../components/Header";
import Card from "../../../components/Card";
import { Link } from "react-router-dom";

// Local reusable component for documentation actions
const DocumentationActions = ({ onView, onDownload, onDelete }) => (
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

// Local reusable component for a documentation card
const DocumentationCard = ({
  title,
  project,
  generatedAt,
  onView,
  onDownload,
  onDelete,
}) => (
  <Card
    title={title}
    description={
      <div>
        <div className="text-sm text-gray-600">Project: {project}</div>
        <div className="text-xs text-gray-400">Generated: {generatedAt}</div>
      </div>
    }
  >
    <DocumentationActions
      onView={onView}
      onDownload={onDownload}
      onDelete={onDelete}
    />
  </Card>
);

const Documentations = () => {
  // Example documentation data (replace with API call)
  const [docs] = useState([
    {
      id: 1,
      title: "API Reference",
      project: "Project 1",
      generatedAt: "2024-07-09",
    },
    {
      id: 2,
      title: "User Guide",
      project: "Project 2",
      generatedAt: "2024-07-08",
    },
    {
      id: 3,
      title: "Setup Instructions",
      project: "Project 1",
      generatedAt: "2024-07-07",
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
          Generate Documentation
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-3/4">
          {docs.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500">
              No documentation generated yet.
            </div>
          ) : (
            docs.map((doc) => (
              <DocumentationCard
                key={doc.id}
                title={doc.title}
                project={doc.project}
                generatedAt={doc.generatedAt}
                onView={() => handleView(doc.id)}
                onDownload={() => handleDownload(doc.id)}
                onDelete={() => handleDelete(doc.id)}
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

export default Documentations;
