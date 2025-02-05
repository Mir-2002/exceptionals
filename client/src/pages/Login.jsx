import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputBox from "../components/InputBox";

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrUsername, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/home");
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };
  return (
    <>
      <main className="flex flex-row w-full h-full items-center justify-center">
        <section className="flex flex-col w-1/2 h-full items-center justify-center space-y-10">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-[4rem] text-dark-blue font-bold font-roboto">
              Login
            </h1>
          </div>
          <form
            onSubmit={handleLogin}
            className="flex flex-col space-y-5 items-center justify-center w-1/2 font-roboto"
          >
            <InputBox
              type="text"
              placeholder="Username or Email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
            <InputBox
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500">{error}</p>}
            <button className="w-1/2 bg-yellow-500 text-white font-bold font-roboto text-lg py-2 rounded-lg hover:bg-yellow-600">
              Submit
            </button>
            <p className="text-md text-dark-blue">
              Don't have an account?{" "}
              <span className="text-yellow-500 hover:underline">
                <Link to="/register">Sign Up</Link>
              </span>
            </p>
          </form>
        </section>
      </main>
    </>
  );
};

export default Login;
