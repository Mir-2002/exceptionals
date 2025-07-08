import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

// Layout component
import Layout from "./shared/components/Layout";

// Page components
import Home from "./features/home/pages/Home";
import About from "./features/home/pages/About";
import Dashboard from "./features/dashboard/pages/Dashboard";
import FileUpload from "./features/fileUpload/pages/FileUpload";
import FolderUpload from './features/folderUpload/pages/FolderUpload';
import UploadSelection from "./features/dashboard/pages/UploadSelection";
import RepoUpload from "./features/repoUpload/pages/RepoUpload";
import ProjectDetail from "./features/project/pages/ProjectDetail";
import DocumentationViewer from './features/documentation/pages/DocumentationViewer';
import EditDocumentation from './features/documentation/pages/EditDocumentation';
import FileDocumentation from './features/documentation/pages/FileDocumentation';

// Auth components
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/Login";
import AuthTest from './features/auth/pages/AuthTest';
import { AuthProvider } from "./shared/contexts/AuthContext";
import GitHubCallback from './features/auth/pages/GitHubCallback';
import ProtectedRoute from './shared/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            
            {/* Protect the dashboard route */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Add other protected routes as needed */}
            <Route path="/upload-selection" element={
              <ProtectedRoute>
                <UploadSelection />
              </ProtectedRoute>
            } />
            
            <Route path="/file-upload" element={<FileUpload />} />
            <Route path="/folder-upload" element={<FolderUpload />} />
            <Route path="/repo-upload" element={<RepoUpload />} />
            <Route path="/auth-test" element={<AuthTest />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project/:id/documentation" element={<DocumentationViewer />} />
            <Route path="/file/:fileId" element={<FileDocumentation />} />
            <Route path="/file/:fileId/edit" element={<EditDocumentation />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
