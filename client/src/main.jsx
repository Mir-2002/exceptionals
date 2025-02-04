import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Header from "./components/Header.jsx";

function Layout() {
  return (
    <>
      <div className="flex flex-col w-screen h-screen">
        <section id="navbar" className="w-screen h-[10vh]">
          <Header />
        </section>
        <Outlet className="w-screen h-[90vh]" />
      </div>
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
