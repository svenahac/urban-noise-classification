// src/lib/api/api.ts
import axios from 'axios';
import { env } from '$env/dynamic/public';

// Create a base axios instance with common configuration
const API_URL = env.PUBLIC_API_URL || 'http://localhost:3000'; // adjust as needed

const axiosInstance = axios.create({
	baseURL: API_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json'
	}
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('auth_token');
		if (token) {
			config.headers['Authorization'] = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor for handling common errors
axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Handle common errors here (e.g., 401 Unauthorized)
		if (error.response && error.response.status === 401) {
			// Clear local storage on auth errors
			localStorage.removeItem('auth_token');
			localStorage.removeItem('user_id');
			localStorage.removeItem('username');
		}
		return Promise.reject(error);
	}
);

export default axiosInstance;
