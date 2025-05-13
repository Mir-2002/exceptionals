import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { autoLogin, getLoggedInUser } from './shared/utils/autoLogin';

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

// Auth components
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/Login";
import AuthTest from './features/auth/pages/AuthTest';
import { AuthProvider } from "./shared/contexts/AuthContext";

function App() {
  // Auto-login at app startup if in development mode
  useEffect(() => {
    if (import.meta.env.DEV && !getLoggedInUser()) {
      console.log('🔐 Development mode: Auto-login enabled');
      autoLogin();
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/file-upload" element={<FileUpload />} />
            <Route path="/folder-upload" element={<FolderUpload />} />
            <Route path="/upload-selection" element={<UploadSelection />} />
            <Route path="/repo-upload" element={<RepoUpload />} />
            <Route path="/auth-test" element={<AuthTest />} />
            <Route 
              path="/login" 
              element={
                import.meta.env.DEV ? <Navigate to="/dashboard" replace /> : <Login />
              } 
            />
            <Route 
              path="/register" 
              element={
                import.meta.env.DEV ? <Navigate to="/dashboard" replace /> : <Register />
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
