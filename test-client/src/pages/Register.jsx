import React, { useState } from "react";
import Heading from "../components/Heading";
import { Form } from "../components/Form";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/auth";

const fields = [
  { name: "username", type: "text", placeholder: "Username" },
  { name: "email", type: "email", placeholder: "Email" },
  { name: "password", type: "password", placeholder: "Password" },
  {
    name: "repeat-password",
    type: "password",
    placeholder: "Confirm Password",
  },
];

const Register = () => {
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    "repeat-password": "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (values.password !== values["repeat-password"]) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await authService.register({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <>
      <main className="w-screen h-screen flex flex-col gap-y-5 items-center justify-center">
        <Heading>Register</Heading>
        <Form
          fields={fields}
          values={values}
          onChange={handleChange}
          onSubmit={handleSubmit}
          buttonText="Register"
        />
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">{success}</div>}
        <p className="text-sm mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </main>
    </>
  );
};

export default Register;
