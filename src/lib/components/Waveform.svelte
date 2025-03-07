<script lang="ts">
	import { onMount } from 'svelte';
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
		updateRegionComment,
		loadNewClip
	} from './region-handlers';
	import { goto } from '$app/navigation';
	import authApi from '$lib/api/auth';
	import { userStore } from '../../stores/userStore';
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

	let userId = $state('user');
	userStore.subscribe((user) => {
		userId = user?.userId ?? '';
	});

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
		const result = await loadNewClip(
			ws,
			regions,
			regionsList,
			currentAudioId,
			sessionAnnotations,
			setCurrentAudioUrl,
			setCurrentAudioId,
			setCurrentTime,
			setDuration,
			setIsPlaying,
			setCurrentTime,
			setDuration,
			userId
		);

		if (result) {
			ws = result.ws;
			regions = result.regions;
			regionsList = result.regionsList;
			sessionAnnotations = result.sessionAnnotations;
		}
	}

	function handleLogout() {
		authApi.handleLogout();
		goto('/');
	}

	onMount(async () => {
		// If url is not provided, get a random audio clip

		let audioUrl = url;
		if (!audioUrl) {
			audioUrl = await getRandomAudioClip(false);
		}

		currentAudioUrl = audioUrl.url;
		currentAudioId = audioUrl.id;
		// Initialize WaveSurfer
		const waveform = initWaveSurfer(currentAudioUrl, setCurrentTime, setDuration);
		ws = waveform.ws;
		regions = waveform.regions;
	});
</script>

<div class="flex flex-col items-center w-full max-w-xs sm:max-w-xl">
	<!-- Waveform Display -->
	<div id="waveform" class="w-full"></div>

	<!-- Media Controls -->
	<div class="flex items-center w-full sm:w-96 bg-white px-4 py-2 rounded-lg mt-10 mb-3 shadow-md">
		<!-- Skip Backward Button -->
		<button
			onclick={() => skipBackward(ws, setCurrentTime)}
			class="text-gray-700 hover:text-gray-900 text-xl mr-1"
		>
			<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faBackward} />
		</button>

		<!-- Play/Pause Button -->
		<button
			onclick={() => togglePlay(ws, setIsPlaying)}
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
				onclick={handleAddRegion}
				class="bg-blue-500 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded"
			>
				Add Region
			</button>
			<button
				onclick={handleLoadNewClip}
				class="bg-green-500 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded"
			>
				Load New Clip
			</button>
			<button
				onclick={handleLogout}
				class="bg-red-500 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded"
			>
				Logout
			</button>
		</div>

		{#each regionsList as region (region.id)}
			<RegionCard
				{region}
				onAnnotationChange={(id: string, annotation: string, comment: string) => {
					// Update both annotation and comment
					regionsList = updateRegionAnnotation(regionsList, id, annotation);

					// If you've implemented the updateRegionComment function
					if (comment !== undefined) {
						regionsList = updateRegionComment(regionsList, id, comment);
					}
				}}
				onDelete={(e: string) => {
					regionsList = regionsList.filter((r) => r.id !== e);
					regions
						.getRegions()
						.find((r: any) => r.id === e)
						?.remove();
				}}
			/>
		{/each}
	</div>
</div>
