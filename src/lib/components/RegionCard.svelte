<script lang="ts">
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { formatTime } from './utils';
	import { env } from '$env/dynamic/public';
	import { mouseTrackingStore } from '$lib/stores/mouseTrackingStore';

	let { region, onDelete, onAnnotationChange, onClick, isAIClass = false } = $props();
	let selectedAnnotation = $state(region.annotation);
	const API_URL = env.PUBLIC_API_URL;

	// Update selectedAnnotation when region.annotation changes
	$effect(() => {
		selectedAnnotation = region.annotation;
	});

	function handleAnnotationChange(className: string) {
		selectedAnnotation = className;
		onAnnotationChange(region.id, selectedAnnotation);
	}

	function handleMouseEnter() {
		mouseTrackingStore.startHover(region.id, isAIClass);
	}

	function handleMouseLeave() {
		mouseTrackingStore.endHover(region.id, isAIClass);
	}

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		mouseTrackingStore.trackClick();
		onClick?.();
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		mouseTrackingStore.trackClick();
		onDelete(region.id);
	}
</script>

<div 
	class="relative group w-full max-w-[200px] mb-2 rounded-md shadow-lg p-0 flex items-center justify-between" 
	style="background-color: {region.color};"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="button"
	tabindex="0"
>
	<!-- Delete button as X, only on hover -->
	<button
		type="button"
		class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center z-20"
		onclick={handleDelete}
		aria-label="Delete"
	>
		×
	</button>
	<!-- Class display -->
	<div class="flex flex-col items-center w-full relative"> 
		<div class="w-full">
			<input
				type="text"
				class="w-full max-w-[200px] h-9 rounded-md border border-gray-900 focus:outline-none focus:ring-2 text-gray-300 focus:ring-white px-2 text-xs sm:text-sm cursor-pointer"
				value={selectedAnnotation || 'Select Class'}
				readonly
				onclick={handleClick}
			/>
		</div>
	</div>
</div>


