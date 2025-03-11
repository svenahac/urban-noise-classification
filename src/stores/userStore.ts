// src/lib/stores/userStore.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Types
type UserState = {
	userId: string | null;
	username: string | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
};

// Initial state
const initialState: UserState = {
	userId: null,
	username: null,
	token: null,
	isAuthenticated: false,
	isLoading: true
};

function createUserStore() {
	const { subscribe, set, update } = writable<UserState>(initialState);

	// Initialize store from localStorage if in browser
	if (browser) {
		const userId = localStorage.getItem('user_id');
		const username = localStorage.getItem('username');
		const token = localStorage.getItem('auth_token');

		if (token && userId && username) {
			set({
				userId,
				username,
				token,
				isAuthenticated: true,
				isLoading: false
			});
		} else {
			set({ ...initialState, isLoading: false });
		}
	}

	return {
		subscribe,

		// Set user data
		setUser: (userData: {
			userId: string;
			username: string;
			token: string;
			isAuthenticated: boolean;
		}) => {
			set({
				...userData,
				isLoading: false
			});
		},

		// Reset user to initial state
		resetUser: () => {
			set({ ...initialState, isLoading: false });
		},

		// Set loading state
		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, isLoading: loading }));
		}
	};
}

// Create and export the store
export const userStore = createUserStore();

// Derived store for quick auth status check
export const isAuthenticated = derived(userStore, ($userStore) => $userStore.isAuthenticated);
