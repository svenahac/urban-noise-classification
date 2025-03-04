<script lang="ts">
	import { onMount } from 'svelte';
	import classesJsonUrl from '$lib/assets/audio-classes.json?url';
	

	let { region, onDelete } = $props();
	let audioClasses = $state<{ id: string; name: string }[]>([]);
	let selectedAnnotation = $state(region.annotation);

	function formatTime(seconds: number) {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		const ms = Math.floor((seconds % 1) * 1000); // Extract milliseconds
		return `${min}:${sec < 10 ? '0' : ''}${sec}.${ms.toString().padStart(3, '0')}`;
	}

	// Load the audio classes from the JSON file
	onMount(async () => {
		const response = await fetch(classesJsonUrl);
		audioClasses = await response.json();
	});
</script>

<div
	class="w-full sm:w-96 h-16 rounded-md shadow-lg p-4 flex items-center justify-between gap-4 bg-gray-50 border border-gray-200"
>
	<!-- Start Time -->
	<div class="flex flex-col items-center w-1/4">
		<label for="start" class="text-xs font-semibold text-gray-700">Start:</label>
		<input
			id="start"
			type="text"
			class="w-full h-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 text-sm"
			placeholder="0:00"
			value={formatTime(region.start)}
		/>
	</div>

	<!-- End Time -->
	<div class="flex flex-col items-center w-1/4">
		<label for="end" class="text-xs font-semibold text-gray-700">End:</label>
		<input
			id="end"
			type="text"
			class="w-full h-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 text-sm"
			placeholder="0:00"
			value={formatTime(region.end)}
		/>
	</div>

	<!-- Annotation -->
	<div class="flex flex-col items-center w-1/4">
		<label for="annotation" class="text-xs font-semibold text-gray-700">Class:</label>
		<select
			id="annotation"
			class="w-full max-w-[200px] h-9 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 text-sm cursor-pointer"
			bind:value={selectedAnnotation}
		>
			<option value="" disabled selected>Select</option>
			{#each audioClasses as { id, name }}
				<option value={id}>{name}</option>
			{/each}
		</select>
	</div>

	<!-- Buttons -->
	<div class="flex flex-col items-center gap-0.5">
		<button
			class="h-6 w-10 bg-blue-500 hover:bg-blue-700 text-white rounded-md font-semibold text-xs"
		>
			Save
		</button>
		<button
			class="h-6 w-10 bg-red-500 hover:bg-red-700 text-white rounded-md font-semibold text-xs"
			onclick={() => {
				onDelete(region.id), console.log(region.id);
			}}
		>
			Delete
		</button>
	</div>
</div>
