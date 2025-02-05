import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputBox from "../components/InputBox";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/login");
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
              Register
            </h1>
            <p className="text-xl text-dark-blue font-medium font-roboto">
              To use our app.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col space-y-5 items-center justify-center w-1/2 font-roboto"
          >
            <InputBox
              type="text"
              placeholder="Username"
              required
              onChange={(e) => setUsername(e.target.value)}
            />
            <InputBox
              type="email"
              placeholder="Email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputBox
              type="password"
              placeholder="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputBox
              type="password"
              placeholder="Confirm Password"
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-red-500">{error}</p>}
            <button className="w-1/2 bg-yellow-500 text-white font-bold font-roboto text-lg py-2 rounded-lg hover:bg-yellow-600">
              Submit
            </button>
            <p className="text-md text-dark-blue">
              Already have an account?{" "}
              <span className="text-yellow-500 hover:underline">
                <Link to="/login">Sign In</Link>
              </span>
            </p>
          </form>
        </section>
      </main>
    </>
  );
};

export default Register;
