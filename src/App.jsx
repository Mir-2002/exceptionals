import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Layout component
import Layout from "./shared/components/Layout";

// Page components
import Home from "./features/home/pages/Home";
import About from "./features/home/pages/About";
import Dashboard from "./features/dashboard/pages/Dashboard";
import FileUpload from "./features/fileUpload/pages/FileUpload";

// Auth components
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/Login";
import { AuthProvider } from "./shared/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/file-upload" element={<FileUpload />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
