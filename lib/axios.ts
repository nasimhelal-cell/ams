import axios from "axios";
import Cookies from "js-cookie";
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Read the token from cookies
    const token = Cookies.get("token"); // Replace 'authToken' with your cookie name
    if (token) {
      // Set the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

export default api;
