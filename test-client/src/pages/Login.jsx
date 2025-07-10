import React, { useState } from "react";
import Heading from "../components/Heading";
import { Form } from "../components/Form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const fields = [
  { name: "username", type: "text", placeholder: "Username" },
  { name: "password", type: "password", placeholder: "Password" },
];

const Login = () => {
  const [values, setValues] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    try {
      await login(values.username, values.password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password.");
    }
  };

  return (
    <main className="w-screen h-screen flex flex-col gap-y-5 items-center justify-center">
      <Heading>Login</Heading>
      <Form
        fields={fields}
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        buttonText="Login"
      />
      {error && <div className="text-red-500">{error}</div>}
      <p className="text-sm mt-2">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-500 hover:underline">
          Register
        </Link>
      </p>
    </main>
  );
};

export default Login;
