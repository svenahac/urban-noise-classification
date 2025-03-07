<script lang="ts">
	import { onMount } from 'svelte';
	import classesJsonUrl from '$lib/assets/audio-classes.json?url';
	import { formatTime } from './utils';

	let { region, onDelete, onAnnotationChange } = $props();
	let audioClasses = $state<{ name: string }[]>([]);
	let selectedAnnotation = $state(region.annotation);
	let searchTerm = $state('');
	let isDropdownOpen = $state(false);
	let comment = $state(region.comment || '');

	// Load the audio classes from the JSON file
	onMount(async () => {
		const response = await fetch(classesJsonUrl);
		audioClasses = await response.json();
	});

	function handleAnnotationChange(className: string) {
		selectedAnnotation = className;
		onAnnotationChange(region.id, selectedAnnotation, comment);

		// Reset search term and close dropdown
		searchTerm = '';
		isDropdownOpen = false;
	}

	function handleCommentChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		comment = target.value;
		onAnnotationChange(region.id, selectedAnnotation, comment);
	}

	function handleInputKeydown(e: KeyboardEvent) {
		// Auto-select if there's exactly one match when Enter is pressed
		if (e.key === 'Enter' && filteredClasses.length === 1) {
			e.preventDefault();
			handleAnnotationChange(filteredClasses[0].name);
		}
	}

	$effect(() => {
		// Close dropdown when clicking outside
		function handleClickOutside(event: MouseEvent) {
			const dropdown = document.getElementById(`dropdown-${region.id}`);
			if (dropdown && !dropdown.contains(event.target as Node)) {
				isDropdownOpen = false;
			}
		}

		if (isDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	$effect(() => {
		// Reset search when dropdown opens
		if (isDropdownOpen) {
			searchTerm = '';
		}
	});

	// Correctly derived filtered classes
	const filteredClasses = $derived(
		audioClasses.filter(({ name }) => name.toLowerCase().includes(searchTerm.toLowerCase()))
	);
</script>

<div
	style="background-color: {region.color};"
	class="w-full sm:w-lg mb-2 rounded-md shadow-lg p-4 flex flex-col items-center justify-between gap-2"
>
	<div class="w-full flex items-center justify-between gap-4">
		<!-- Start Time -->
		<div class="flex flex-col items-center w-1/5">
			<label for="start" class="text-xs font-semibold text-white">Start:</label>
			<input
				id="start"
				type="text"
				readonly
				class="w-full h-8 rounded-md border border-gray-900 focus:outline-none focus:ring-2 text-gray-300 focus:ring-white px-2 text-xs sm:text-sm"
				placeholder="0:00"
				value={formatTime(region.start)}
			/>
		</div>

		<!-- End Time -->
		<div class="flex flex-col items-center w-1/5">
			<label for="end" class="text-xs font-semibold text-white">End:</label>
			<input
				id="end"
				type="text"
				readonly
				class="w-full h-8 rounded-md border border-gray-900 focus:outline-none focus:ring-2 text-gray-300 focus:ring-white px-2 text-xs sm:text-sm"
				placeholder="0:00"
				value={formatTime(region.end)}
			/>
		</div>

		<!-- Annotation -->
		<div class="flex flex-col items-center w-2/5 relative" id={`dropdown-${region.id}`}>
			<label for="annotation" class="text-xs font-semibold text-white">Class:</label>

			<!-- Searchable Dropdown -->
			<div class="w-full">
				<input
					type="text"
					class="w-full max-w-[200px] h-9 rounded-md border border-gray-900 focus:outline-none focus:ring-2 text-gray-300 focus:ring-white px-2 text-xs sm:text-sm cursor-pointer"
					placeholder={selectedAnnotation || 'Select Class (optional)'}
					bind:value={searchTerm}
					onfocus={() => (isDropdownOpen = true)}
					onkeydown={handleInputKeydown}
				/>

				{#if isDropdownOpen}
					<ul
						class="absolute z-10 max-w-32 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg mt-1"
						role="listbox"
					>
						{#each filteredClasses as { name }}
							<button
								type="button"
								role="option"
								aria-selected={selectedAnnotation === name}
								class="w-full text-left px-2 py-1 text-xs sm:text-sm hover:bg-gray-300 cursor-pointer {selectedAnnotation ===
								name
									? 'bg-gray-300'
									: ''}"
								onclick={() => handleAnnotationChange(name)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										handleAnnotationChange(name);
									}
								}}
							>
								{name}
							</button>
						{:else}
							<div class="px-2 py-1 text-xs text-gray-500">No classes found</div>
						{/each}
					</ul>
				{/if}
			</div>
		</div>

		<!-- Buttons -->
		<div class="flex flex-col items-center gap-0.5">
			<button
				type="button"
				class="h-6 w-12 bg-red-500 hover:bg-red-700 text-white rounded-md font-semibold text-xs sm:text-sm"
				onclick={() => {
					onDelete(region.id);
				}}
			>
				Delete
			</button>
		</div>
	</div>

	<!-- Comment Field -->
	<div class="w-full mt-2">
		<textarea
			class="w-full h-16 rounded-md border border-gray-900 focus:outline-none focus:ring-2 text-gray-800 focus:ring-white px-2 py-1 text-xs sm:text-sm"
			placeholder="Add a comment (optional)"
			bind:value={comment}
			oninput={handleCommentChange}
		></textarea>
	</div>
</div>

<style>
	/* Custom scrollbar for the dropdown */
	ul::-webkit-scrollbar {
		width: 6px;
	}
	ul::-webkit-scrollbar-track {
		background: #f1f1f1;
	}
	ul::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 3px;
	}
	ul::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
