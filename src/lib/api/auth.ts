// src/lib/api/auth.ts
import api from './api';
import { browser } from '$app/environment';
import { userStore } from '../../stores/userStore';
import { AxiosError } from 'axios';

// Define types for requests and responses
export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	message: string;
	userId: number;
	token: string;
}

export interface AuthError {
	error: string;
}

export interface LoginResult {
	success: boolean;
	error?: string;
}

// Auth API services
const authApi = {
	/**
	 * Login a user with username and password
	 */
	login: async (credentials: LoginRequest): Promise<LoginResponse> => {
		const response = await api.post<LoginResponse>('/login', credentials);
		return response.data;
	},

	/**
	 * Register a new user
	 */
	register: async (userData: LoginRequest): Promise<LoginResponse> => {
		const response = await api.post<LoginResponse>('/register', userData);
		return response.data;
	},

	/**
	 * Check if the current auth token is valid
	 */
	verifyToken: async (): Promise<boolean> => {
		try {
			await api.get('/protected');
			return true;
		} catch (error) {
			return false;
		}
	},

	/**
	 * Handle login process including API call and user store update
	 */
	handleLogin: async (username: string, password: string): Promise<LoginResult> => {
		try {
			const response = await authApi.login({ username, password });
			const { userId, token } = response;

			if (browser) {
				localStorage.setItem('auth_token', token);
				localStorage.setItem('user_id', userId.toString());
				localStorage.setItem('username', username);
			}

			// Update the user store
			userStore.setUser({
				userId,
				username,
				isAuthenticated: true
			});

			return { success: true };
		} catch (error) {
			let errorMessage = 'An error occurred during login';
			if (error instanceof Error) {
				if (error instanceof AxiosError && error.response && error.response.data) {
					errorMessage = error.response.data.error || errorMessage;
				}
			}

			return { success: false, error: errorMessage };
		}
	},

	/**
	 * Handle logout process including clearing localStorage and user store
	 */
	handleLogout: (): void => {
		if (browser) {
			localStorage.removeItem('auth_token');
			localStorage.removeItem('user_id');
			localStorage.removeItem('username');
		}

		// Reset the user store
		userStore.resetUser();
	}
};

export default authApi;
