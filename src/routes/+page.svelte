<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import authApi from '$lib/api/auth';

	let username = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleSubmit() {
		error = '';
		loading = true;

		try {
			const result = await authApi.handleLogin(username, password);

			if (result.success) {
				// Redirect to annotator page
				goto('/annotator');
			} else {
				error = result.error || 'Login failed';
			}
		} catch (err) {
			error = 'An unexpected error occurred';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-600"
>
	<form
		on:submit|preventDefault={handleSubmit}
		class="flex flex-col items-center w-xs max-w-xs sm:max-w-md p-4 bg-gray-800 rounded-lg shadow-lg"
	>
		{#if error}
			<div class="w-full p-2 mb-3 bg-red-600 text-white text-sm rounded">
				{error}
			</div>
		{/if}

		<input
			type="text"
			bind:value={username}
			class="w-full h-10 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 mb-3"
			placeholder="Username"
			required
		/>

		<input
			type="password"
			bind:value={password}
			class="w-full h-10 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 mb-3"
			placeholder="Password"
			required
		/>

		<button
			type="submit"
			class="w-full h-10 rounded-md bg-blue-500 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={loading}
		>
			{loading ? 'Logging in...' : 'Login'}
		</button>
	</form>
</div>
