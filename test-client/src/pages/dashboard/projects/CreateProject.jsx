import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import projectService from "../../../services/projects";
import { useRefresh } from "../../../contexts/RefreshContext";

const CreateProject = () => {
  const [values, setValues] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await projectService.createProject(values);
      console.log("Project created:", response);
      triggerRefresh("projects");
      navigate("/dashboard/projects");
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold mb-4">Create Project</h2>
        <input
          type="text"
          name="name"
          placeholder="Project Name"
          value={values.name}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <textarea
          name="description"
          placeholder="Project Description"
          value={values.description}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          rows={4}
        />
        {error && <div className="text-red-500">{error}</div>}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard/projects")}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreateProject;
