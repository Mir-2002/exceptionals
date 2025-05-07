import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import Layout from "./shared/components/Layout";
import Home from "./features/home/pages/Home";
import Dashboard from "./features/dashboard/pages/Dashboard";
import About from "./features/home/pages/About";
import FileUpload from "./features/fileUpload/pages/FileUpload";
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
            
            {/* These were protected, now they're directly accessible */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/file-upload" element={<FileUpload />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
