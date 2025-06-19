<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getRandomAudioClip } from '$lib/audioLoader';
	import WaveSurfer from 'wavesurfer.js';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBackward,
		faForward,
		faPlay,
		faPause,
		faVolumeHigh
	} from '@fortawesome/free-solid-svg-icons';
	import RegionCard from './RegionCard.svelte';
	import type { RegionType, AnnotationData } from '$lib/types';
	import { formatTime } from './utils';
	import defaultClasses from '$lib/assets/classes.json';
	import {
		togglePlay,
		skipForward,
		skipBackward,
		changeVolume,
		updateTime,
		initWaveSurfer
	} from './waveform-actions';
	import {
		addRegion,
		updateRegionAnnotation,
		loadNewClip,
		createAIRegions
	} from './region-handlers';
	import { goto } from '$app/navigation';
	import authApi from '$lib/api/auth';
	import { userStore } from '../../stores/userStore';
	import axios from 'axios';
	import { env } from '$env/dynamic/public';
	import { mouseTrackingStore } from '$lib/stores/mouseTrackingStore';

	let { url = undefined } = $props();
	let ws: WaveSurfer;
	let regions: any;

	// Local state
	let isPlaying = $state(false);
	let volume = $state(1);
	let currentTime = $state('0:00.000');
	let duration = $state('0:00.000');
	let regionsList = $state<RegionType[]>([]);
	let currentAudioUrl = $state(url);
	let currentAudioId = $state('');
	let sessionAnnotations = $state<AnnotationData[]>([]);
	let audioClasses = $state<{ name: string }[]>([]);
	let searchTerm = $state('');
	let selectedRegionId = $state<string | null>(null);
	let labelingStartTime = $state<number | null>(null);
	let currentAudioData = $state<any>(null);
	const API_URL = env.PUBLIC_API_URL;

	let userId = $state('user');
	userStore.subscribe((user) => {
		userId = user?.userId ?? '';
	});

	let loading = $state(true);

	// Add new class function
	async function addNewClass(name: string) {
		try {
			const response = await axios.post(API_URL + '/classes', { name });
			audioClasses = [...audioClasses, response.data];
			return response.data;
		} catch (error: any) {
			if (error.response?.status === 409) {
				audioClasses = [...audioClasses, { name }];
				return { name };
			}
			alert('Failed to add new class.');
			return null;
		}
	}

	// Handle class selection
	function handleClassSelection(className: string) {
		if (selectedRegionId) {
			const region = regionsList.find(r => r.id === selectedRegionId);
			if (region) {
				regionsList = updateRegionAnnotation(regionsList, selectedRegionId, className);
			}
		}
		searchTerm = '';
	}

	// Handle input keydown
	async function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredClasses.length === 1) {
				handleClassSelection(filteredClasses[0].name);
			} else if (filteredClasses.length === 0 && searchTerm) {
				const newClass = await addNewClass(searchTerm);
				if (newClass) {
					handleClassSelection(newClass.name);
				}
			}
		}
	}

	// Filtered classes
	const filteredClasses = $derived(
		audioClasses.filter(({ name }) => name.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	// Check if a class is an AI class
	function isAIClass(className: string): boolean {
		return audioClasses.findIndex(c => c.name === className) < (audioClasses.length - defaultClasses.length);
	}

	// State update handlers
	function setIsPlaying(value: boolean) {
		isPlaying = value;
	}

	function setCurrentTime(time: string) {
		currentTime = time;
	}

	function setDuration(value: string) {
		duration = value;
	}

	function setCurrentAudioUrl(url: string) {
		currentAudioUrl = url;
	}

	function setCurrentAudioId(id: string) {
		currentAudioId = id;
	}

	// Region handlers
	function handleRegionUpdate(regionId: string) {
		const region = regions.getRegions().find((r: any) => r.id === regionId);
		if (region) {
			const index = regionsList.findIndex((r) => r.id === regionId);
			if (index !== -1) {
				regionsList[index].start = region.start;
				regionsList[index].end = region.end;
				regionsList = [...regionsList];
			}
		}
	}

	function handleRegionRemove(regionId: string) {
		regionsList = regionsList.filter((r) => r.id !== regionId);
	}

	function handleAddRegion() {
		regionsList = addRegion(ws, regions, regionsList);
		const newRegion = regionsList[regionsList.length - 1];

		// Add event listeners to the newly created region
		const region = regions.getRegions().find((r: any) => r.id === newRegion.id);
		if (region) {
			region.on('remove', () => handleRegionRemove(newRegion.id));
			region.on('update-end', () => handleRegionUpdate(newRegion.id));
		}
	}

	async function handleLoadNewClip() {
		// Validate regions before starting the loading process
		const validRegions = regionsList.filter(
			(region) => region.annotation?.trim() !== '' 
		);

		if (validRegions.length !== regionsList.length) {
			alert('Please provide a class for each region.');
			return;
		}

		if (validRegions.length === 0) {
			alert('Please add at least one region.');
			return;
		}

		loading = true;

		try {
			const result = await loadNewClip(
				ws,
				regions,
				validRegions,
				currentAudioId,
				sessionAnnotations,
				setCurrentAudioUrl,
				setCurrentAudioId,
				setCurrentTime,
				setDuration,
				setIsPlaying,
				setCurrentTime,
				setDuration,
				userId,
				labelingStartTime,
				currentAudioData?.aiClasses || [],
				currentAudioData?.aiRegions || [],
				currentAudioData?.interface || 0,
				mouseTrackingStore
			);

			if (result) {
				// Update state with new audio data
				currentAudioUrl = result.audioUrl;
				currentAudioId = result.audioId;
				currentAudioData = {
					aiClasses: result.aiClasses,
					aiRegions: result.aiRegions,
					interface: result.interface
				};
				sessionAnnotations = result.sessionAnnotations;
				regionsList = [];
				labelingStartTime = null;
				mouseTrackingStore.reset();

				// Reset playback state
				setIsPlaying(false);
				setCurrentTime('0:00.000');
				setDuration('0:00.000');

				// Wait for DOM update before initializing WaveSurfer
				loading = false;
				await tick();

				// Initialize WaveSurfer
				const waveform = initWaveSurfer(currentAudioUrl, setCurrentTime, setDuration);
				ws = waveform.ws;
				regions = waveform.regions;

				// Wait for WaveSurfer to be ready
				ws.on('ready', () => {
					if (currentAudioData.interface === 2 && currentAudioData.aiRegions?.length > 0) {
						regionsList = createAIRegions(ws, regions, currentAudioData.aiRegions);
					}
					mouseTrackingStore.setFileLoadTime();
				});
			} else {
				loading = false;
			}
		} catch (error) {
			console.error('Error loading new clip:', error);
			loading = false;
		}
	}

	function handleLogout() {
		authApi.handleLogout();
		goto('/');
	}

	function handlePlay() {
		if (!labelingStartTime) {
			labelingStartTime = Date.now();
		}
		togglePlay(ws, setIsPlaying);
	}

	onMount(() => {
		// Reset mouse tracking when loading new audio
		mouseTrackingStore.reset();
		
		// Add mouse move tracking to the entire interface
		const handleMouseMove = (e: MouseEvent) => {
			mouseTrackingStore.trackMouseMove(e.clientX, e.clientY);
		};

		// Track all mouse clicks
		const handleMouseClick = () => {
			mouseTrackingStore.trackClick();
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mousedown', handleMouseClick);

		// Load initial audio
		(async () => {
			loading = true;
			let audioUrl = url;
			if (!audioUrl) {
				audioUrl = await getRandomAudioClip(userId);
			}

			currentAudioUrl = audioUrl.url;
			currentAudioId = audioUrl.id;
			audioClasses = audioUrl.classes;
			currentAudioData = audioUrl;

			loading = false;
			await tick(); // Wait for DOM to update and #waveform to be present

			// Initialize WaveSurfer
			const waveform = initWaveSurfer(currentAudioUrl, setCurrentTime, setDuration);
			ws = waveform.ws;
			regions = waveform.regions;

			ws.on('ready', () => {
				if (audioUrl.interface === 2 && audioUrl.aiRegions && audioUrl.aiRegions.length > 0) {
					regionsList = createAIRegions(ws, regions, audioUrl.aiRegions);
				}
				mouseTrackingStore.setFileLoadTime();
			});
		})();

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mousedown', handleMouseClick);
		};
	});
</script>

{#if loading}
<div class="absolute inset-0 flex flex-col items-center justify-center z-50 bg-gray-900 bg-opacity-80 min-h-screen w-full">
	<div class="flex flex-col items-center">
		<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
		<span class="text-white text-lg font-semibold">Loading audio...</span>
	</div>
</div>
{:else}
<div class="flex flex-col items-center w-full max-w-xs sm:max-w-xl">
	<!-- Waveform Display -->
	<div 
		id="waveform" 
		class="w-full"
		role="application"
		onmouseenter={() => mouseTrackingStore.startHover('wavesurfer', false)}
		onmouseleave={() => mouseTrackingStore.endHover('wavesurfer', false)}
	></div>

	<!-- Add Region Button -->
	<button
		id="add-region-button"
		onclick={handleAddRegion}
		onmouseenter={() => mouseTrackingStore.startHover('add-region', false)}
		onmouseleave={() => mouseTrackingStore.endHover('add-region', false)}
		class="bg-blue-500 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded mt-4"
	>
		Add Region
	</button>

	<!-- Media Controls -->
	<div 
		id="media-controls"
		role="toolbar"
		aria-label="Media controls"
		tabindex="0"
		onmouseenter={() => mouseTrackingStore.startHover('media-controls', false)}
		onmouseleave={() => mouseTrackingStore.endHover('media-controls', false)}
		class="flex items-center w-full sm:w-96 bg-white px-4 py-2 rounded-lg mt-4 mb-3 shadow-md"
	>
		<!-- Skip Backward Button -->
		<button
			onclick={() => skipBackward(ws, setCurrentTime)}
			class="text-gray-700 hover:text-gray-900 text-xl mr-1"
		>
			<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faBackward} />
		</button>

		<!-- Play/Pause Button -->
		<button
			onclick={handlePlay}
			class="text-gray-700 hover:text-gray-900 text-2xl"
		>
			{#if isPlaying}
				<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faPause} />
			{:else}
				<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faPlay} />
			{/if}
		</button>

		<!-- Skip Forward Button -->
		<button
			onclick={() => skipForward(ws, setCurrentTime)}
			class="text-gray-700 hover:text-gray-900 text-xl ml-1"
		>
			<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faForward} />
		</button>

		<!-- Time Display -->
		<span class="text-gray-700 text-xs ml-2 sm:text-sm sm:ml-3">{currentTime} / {duration}</span>

		<!-- Spacer -->
		<div class="flex-grow"></div>
		<!-- Volume Icon & Control -->
		<button class="text-gray-700 hover:text-gray-900 mr-2 text-lg">
			<FontAwesomeIcon class="text-blue-500" icon={faVolumeHigh} />
		</button>
		<input
			type="range"
			class="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
			min="0"
			max="1"
			step="0.01"
			bind:value={volume}
			oninput={(e) => changeVolume(ws, e)}
		/>
	</div>

	<!-- Region Controls -->
	<div class="flex flex-col items-center w-full sm:w-96 rounded-lg mt-2">
		<!-- Action Buttons -->
		<div class="mb-3">
			<button
				id="submit-button"
				onclick={handleLoadNewClip}
				onmouseenter={() => mouseTrackingStore.startHover('submit', false)}
				onmouseleave={() => mouseTrackingStore.endHover('submit', false)}
				class="bg-green-500 hover:bg-green-700 text-white text-sm sm:text-base font-semibold py-2 px-4 rounded"
			>
				Submit
			</button>
		</div>

		<!-- Region Cards -->
		{#each regionsList as region (region.id)}
			<RegionCard
				{region}
				onAnnotationChange={(id: string, annotation: string) => {
					regionsList = updateRegionAnnotation(regionsList, id, annotation);
				}}
				onDelete={(e: string) => {
					regionsList = regionsList.filter((r) => r.id !== e);
					regions
						.getRegions()
						.find((r: any) => r.id === e)
						?.remove();
				}}
				onClick={() => selectedRegionId = region.id}
				isAIClass={isAIClass(region.annotation)}
			/>
		{/each}

		<!-- Permanent Class Dropdown -->
		<div 
			id="class-dropdown"
			role="combobox"
			aria-label="Class selection"
			aria-controls="class-list"
			aria-expanded="false"
			tabindex="0"
			onmouseenter={() => mouseTrackingStore.startHover('class-dropdown', false)}
			onmouseleave={() => mouseTrackingStore.endHover('class-dropdown', false)}
			class="w-full max-w-[200px] mt-4"
		>
			<input
				type="text"
				class="w-full h-9 rounded-md border border-gray-900 focus:outline-none focus:ring-2 text-gray-300 focus:ring-white px-2 text-xs sm:text-sm"
				placeholder="Search or add new class..."
				bind:value={searchTerm}
				onkeydown={handleInputKeydown}
			/>

			<ul
				id="class-list"
				class="w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg mt-1"
				role="listbox"
			>
				{#each filteredClasses as { name }}
					{@const regionsWithClass = regionsList.filter(r => r.annotation === name)}
					{@const colors = regionsWithClass.map(r => r.color)}
					<button
						type="button"
						role="option"
						aria-selected={Boolean(selectedRegionId && regionsList.find(r => r.id === selectedRegionId)?.annotation === name)}
						class="w-full text-left px-2 py-1 text-xs sm:text-sm hover:bg-gray-300 cursor-pointer relative overflow-hidden"
						class:bg-gray-100={isAIClass(name)}
						onclick={() => handleClassSelection(name)}
					>
						<div class="absolute inset-0 flex">
							{#each colors as color}
								<div class="h-full" style="width: {100 / colors.length}%; background-color: {color}"></div>
							{/each}
						</div>
						<span class="relative z-10 px-2">{name}</span>
					</button>
				{:else}
					{#if searchTerm}
						<button
							class="px-2 py-1 text-xs text-blue-600 cursor-pointer hover:bg-blue-100 w-full text-left"
							onclick={async () => {
								const newClass = await addNewClass(searchTerm);
								if (newClass) handleClassSelection(newClass.name);
							}}
						>
							Add "{searchTerm}" as new class
						</button>
					{:else}
						<div class="px-2 py-1 text-xs text-gray-500">No classes found</div>
					{/if}
				{/each}
			</ul>
		</div>
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
{/if}
