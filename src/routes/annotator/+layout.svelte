<!-- src/routes/annotator/+layout.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, isAuthenticated } from '../../stores/userStore';
	import authApi from '$lib/api/auth';
	import { browser } from '$app/environment';

	// On mount, verify authentication and redirect immediately if not authenticated
	onMount(async () => {
		// First check if we're already authenticated according to the store
		if (!$isAuthenticated) {
			userStore.setLoading(true);

			// If not authenticated, try to verify with backend
			try {
				const isValid = await authApi.verifyToken();
				if (!isValid && browser) {
					// Immediate redirect to login page if not authenticated
					goto('/');
				}
			} catch (error) {
				// If verification fails, redirect to login
				if (browser) {
					goto('/');
				}
			} finally {
				userStore.setLoading(false);
			}
		}
	});
</script>

{#if $userStore.isLoading}
	<div class="flex items-center justify-center min-h-screen">
		<p>Loading...</p>
	</div>
{:else if $isAuthenticated}
	<slot></slot>
{:else}
	<script>
		// Immediate JavaScript redirect as a fallback
		if (typeof window !== 'undefined') {
			window.location.href = '/';
		}
	</script>
	<div class="flex items-center justify-center min-h-screen">
		<p>You must be logged in to access this page. Redirecting...</p>
	</div>
{/if}
