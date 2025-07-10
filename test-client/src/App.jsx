import { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Heading from "./components/Heading";
import Register from "./pages/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Projects from "./pages/dashboard/projects/Projects";
import Files from "./pages/dashboard/files/Files";
import Documentations from "./pages/dashboard/documentations/Documentations";
import ViewProject from "./pages/dashboard/projects/ViewProject";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import CreateProject from "./pages/dashboard/projects/CreateProject";
import { RefreshProvider } from "./contexts/RefreshContext";
import ManageProject from "./pages/dashboard/projects/ManageProject";

function Home() {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log("Routing to login...");
    navigate("/login");
  };

  return (
    <>
      <main className="w-screen h-screen flex flex-col gap-y-5 items-center justify-center">
        <Heading>Exceptionals</Heading>
        <button
          onClick={handleClick}
          className="text-xl bg-gray-200 p-4 font-medium rounded-2xl"
        >
          Get Started
        </button>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected dashboard and nested routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            >
              <Route path="create" element={<CreateProject />} />
              <Route path=":projectId" element={<ViewProject />} />
              <Route path=":projectId/manage" element={<ManageProject />} />
            </Route>
            <Route
              path="/dashboard/files"
              element={
                <ProtectedRoute>
                  <Files />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/documentations"
              element={
                <ProtectedRoute>
                  <Documentations />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;
