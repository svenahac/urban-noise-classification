<script lang="ts">
	import Waveform from '$lib/components/Waveform.svelte';
	import { goto } from '$app/navigation';
	import authApi from '$lib/api/auth';

	function handleLogout() {
		authApi.handleLogout();
		goto('/');
	}
</script>

<div
	class="flex flex-col items-center pt-10 bg-gradient-to-b min-h-screen from-gray-900 to-gray-600 relative"
>
	<button
		onclick={handleLogout}
		class="absolute top-2 right-4 bg-red-500 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded"
	>
		Logout
	</button>
	<Waveform />
</div>
