import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import Card from "../../../components/Card";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import projectService from "../../../services/projects";
import { useRefresh } from "../../../contexts/RefreshContext";

// Local reusable component for project actions
const ProjectActions = ({ onView, onDelete, onManage }) => (
  <div className="flex flex-row gap-x-3">
    <button
      className="bg-blue-500 text-white px-4 py-2 rounded font-medium"
      onClick={onView}
    >
      View
    </button>
    <button
      className="bg-yellow-500 text-white px-4 py-2 rounded font-medium"
      onClick={onManage}
    >
      Manage
    </button>
    <button
      className="bg-red-500 text-white px-4 py-2 rounded font-medium"
      onClick={onDelete}
    >
      Delete
    </button>
  </div>
);

// Local reusable component for a project card
const ProjectCard = ({ title, description, onView, onManage, onDelete }) => (
  <Card title={title} description={description}>
    <ProjectActions onView={onView} onManage={onManage} onDelete={onDelete} />
  </Card>
);

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getRefreshTrigger, triggerRefresh } = useRefresh(); // Destructure triggerRefresh here
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const isNestedRoute = location.pathname !== "/dashboard/projects";

  // Fetch projects from API
  useEffect(() => {
    // Only fetch when we're on the main projects page
    if (isNestedRoute) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProjects = async () => {
      setLoading(true);
      try {
        console.log("Fetching projects..."); // Debug log
        const response = await projectService.getMyProjects();
        console.log("Projects response:", response); // Debug log

        let projectsData = [];
        if (response.projects && Array.isArray(response.projects)) {
          projectsData = response.projects;
        } else if (Array.isArray(response)) {
          projectsData = response;
        } else {
          projectsData = [];
        }
        setProjects(projectsData);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [
    location.pathname,
    navigate,
    isNestedRoute,
    getRefreshTrigger("projects"),
  ]);

  const handleView = (id) => {
    navigate(`/dashboard/projects/${id}`);
  };
  const handleManage = (id) => {
    navigate(`/dashboard/projects/${id}/manage`);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      console.log("Attempting to delete project with ID:", id);
      await projectService.deleteProject(id);
      console.log("Project deleted successfully from component:", id);
      triggerRefresh("projects"); // Refresh the list after deletion
    } catch (err) {
      console.error("Error deleting project in component:", err);
      alert("Failed to delete project.");
    }
  };
  const handleCreate = () => {
    navigate("/dashboard/projects/create");
  };

  return (
    <>
      <main className="w-screen h-screen flex flex-col items-center">
        <section className="w-3/4">
          <Header />
        </section>

        <section className="flex flex-1 w-full flex-col items-center justify-center gap-8 bg-gray-200">
          {!isNestedRoute ? (
            <>
              {loading ? (
                <div className="text-gray-500 text-lg mt-8">
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <>
                  <button
                    onClick={handleCreate}
                    className="text-2xl text-blue-500 bg-white px-5 py-3 rounded-2xl border-2 font-medium"
                  >
                    Create a Project
                  </button>
                  <div className="text-gray-500 text-lg mt-8">
                    No existing projects. Create your first project to get
                    started!
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCreate}
                    className="text-2xl text-blue-500 bg-white px-5 py-3 rounded-2xl border-2 font-medium"
                  >
                    Create a Project
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {projects.map((project) => (
                      <ProjectCard
                        key={project._id}
                        title={project.name}
                        description={project.description}
                        onView={() => handleView(project._id)}
                        onManage={() => handleManage(project._id)}
                        onDelete={() => handleDelete(project._id)}
                      />
                    ))}
                  </div>
                </>
              )}
              <Link to="/dashboard" className="hover:underline">
                Back to Dashboard
              </Link>
            </>
          ) : (
            <Outlet />
          )}
        </section>
      </main>
    </>
  );
};

export default Projects;
