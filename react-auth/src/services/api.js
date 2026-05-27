import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login function
export const login = async (email, password) => {
  try {
    const response = await api.post('/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.error || 'Login failed');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    } else {
      // Something else happened
      throw new Error('An error occurred. Please try again.');
    }
  }
};

// Signup function
export const signup = async (name, email, password) => {
  try {
    const response = await api.post('/signup', {
      name,
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.error || 'Signup failed');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    } else {
      // Something else happened
      throw new Error('An error occurred. Please try again.');
    }
  }
};

export default api;
