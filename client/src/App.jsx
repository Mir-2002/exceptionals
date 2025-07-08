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
import ExclusionSettings from './features/project/pages/ExclusionSettings';
import GenerateDocumentation from './features/documentation/pages/GenerateDocumentation';

// Auth components
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/Login";
import AuthTest from './features/auth/pages/AuthTest';
import { AuthProvider } from "./shared/contexts/AuthContext";
import GitHubCallback from './features/auth/pages/GitHubCallback';
import ProtectedRoute from './shared/components/ProtectedRoute';

// Test component
import TestRoutes from './features/test/pages/TestRoutes';

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
            
            {/* ADD TEST ROUTES PAGE */}
            <Route path="/test-routes" element={<TestRoutes />} />
            
            {/* TEMPORARILY REMOVE PROTECTION FOR TESTING */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload-selection" element={<UploadSelection />} />
            
            <Route path="/file-upload" element={<FileUpload />} />
            <Route path="/folder-upload" element={<FolderUpload />} />
            <Route path="/repo-upload" element={<RepoUpload />} />
            <Route path="/auth-test" element={<AuthTest />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project/:id/generate" element={<GenerateDocumentation />} />
            <Route path="/project/:id/documentation" element={<DocumentationViewer />} />
            <Route path="/file/:fileId" element={<FileDocumentation />} />
            <Route path="/file/:fileId/edit" element={<EditDocumentation />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />
            <Route path="/project/:id/exclusions" element={<ExclusionSettings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
