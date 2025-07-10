import React from "react";
import Header from "../../components/Header";
import Card from "../../components/Card";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <main className="w-screen h-screen flex flex-col items-center">
        <section className="w-3/4">
          <Header />
        </section>
        <section className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card title="Projects" description="Manage your projects">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => navigate("/dashboard/projects")}
              >
                Go to Projects
              </button>
            </Card>
            <Card title="Files" description="View your uploaded files">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => navigate("/dashboard/files")}
              >
                Go to Files
              </button>
            </Card>
            <Card
              title="Documentations"
              description="See or edit generated docs"
            >
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => navigate("/dashboard/documentations")}
              >
                Go to Docs
              </button>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
};

export default Dashboard;
