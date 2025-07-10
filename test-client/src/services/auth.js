import axios from "axios";

const API_URL = "http://localhost:8000/api/auth"; // Adjust if your backend URL is different

const authService = {
  login: async (username, password) => {
    // FastAPI expects form data for OAuth2PasswordRequestForm
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    const response = await axios.post(`${API_URL}/login`, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  },

  register: async ({ username, email, password }) => {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
    });
    return response.data;
  },
};

export default authService;
