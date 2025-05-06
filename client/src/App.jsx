import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import Register from "./features/auth/pages/Register";
import Layout from "./shared/components/Layout";
import Home from "./features/home/pages/Home";
import Login from "./features/auth/pages/Login";
import Dashboard from "./features/dashboard/pages/Dashboard";
import About from "./features/home/pages/About";
import ProtectedRoutes from "./shared/routes/ProtectedRoutes";
import { AuthProvider } from "./shared/contexts/AuthContext";
import FileUpload from "./features/fileUpload/pages/FileUpload";

function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about" element={<About />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoutes />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/file-upload" element={<FileUpload />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
