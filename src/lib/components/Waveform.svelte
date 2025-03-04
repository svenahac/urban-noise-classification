<script lang="ts">
	import { onMount } from 'svelte';
	import WaveSurfer from 'wavesurfer.js';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBackward,
		faForward,
		faPlay,
		faPause,
		faVolumeHigh
	} from '@fortawesome/free-solid-svg-icons';
	import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
	import RegionCard from './RegionCard.svelte';

	type RegionType = {
		id: string;
		start: number;
		end: number;
		color: string;
		annotation: string;
	};

	//export let url: string; // Audio URL passed as a prop
	let { url } = $props();
	let ws: WaveSurfer;
	let regions: any; // Declare regions as any typregions: ions as any type for now
	let isPlaying = $state(false);
	let volume = $state(1); // Default volume (1 = 100%)
	let currentTime = $state('0:00.000');
	let duration = $state('0:00.000');
	let regionsList = $state<RegionType[]>([]);
	const skipAmount = 0.05; // Skip 1/20th of a second
	const random = (min: number, max: number) => Math.random() * (max - min) + min;
	const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

	// Format time helper function (adds milliseconds)
	function formatTime(seconds: number) {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		const ms = Math.floor((seconds % 1) * 1000); // Extract milliseconds
		return `${min}:${sec < 10 ? '0' : ''}${sec}.${ms.toString().padStart(3, '0')}`;
	}

	// Play/Pause Function
	function togglePlay() {
		if (ws) {
			ws.playPause();
			isPlaying = !isPlaying;
		}
	}

	// Skip Forward
	function skipForward() {
		if (ws) {
			ws.setTime(ws.getCurrentTime() + skipAmount);
			updateTime(); // Manually update timer
		}
	}

	// Skip Backward
	function skipBackward() {
		if (ws) {
			ws.setTime(Math.max(0, ws.getCurrentTime() - skipAmount));
			updateTime(); // Manually update timer
		}
	}

	// Volume Control Function
	function changeVolume(event: Event) {
		if (ws) {
			const target = event.target as HTMLInputElement;
			volume = parseFloat(target.value);
			ws.setVolume(volume);
		}
	}

	// Update the time display
	function updateTime() {
		if (ws) {
			currentTime = formatTime(ws.getCurrentTime());
		}
	}

	// Add Region Function
	function addRegion() {
		if (ws) {
			const start = ws.getCurrentTime(); // Get the current time position
			const end = start + 2; // Set the region to last for 2 seconds
			const color = randomColor();
			const id = `region-${Date.now()}`;
			const region = regions.addRegion({
				id: id,
				start: start,
				end: end,
				color: color,
				drag: true,
				resize: true
			});

			regionsList = [...regionsList, { id, start, end, color, annotation: '' }];

			region.on('remove', () => {
				regionsList = regionsList.filter((r) => r.id !== id);
			});

			region.on('update-end', () => {
				const index = regionsList.findIndex((r) => r.id === id);
				regionsList[index].start = region.start;
				regionsList[index].end = region.end;
			});
		}
	}

	onMount(() => {
		// Create the WaveSurfer instance first
		ws = WaveSurfer.create({
			container: '#waveform',
			waveColor: '#d3cecd',
			progressColor: '#005cc8',
			url: url,
			dragToSeek: true,
			height: 50,
			plugins: [] // Initialize without regions plugin for now
		});

		// Initialize the regions plugin and attach it to WaveSurfer after it is created
		regions = RegionsPlugin.create(); // Initialize regions plugin
		ws.registerPlugin(regions); // Add regions plugin after WaveSurfer is created

		// Handle events after the audio is ready
		ws.on('ready', () => {
			duration = formatTime(ws.getDuration());
			updateTime();
		});

		// Update time during playback
		ws.on('audioprocess', updateTime);
		ws.on('seeking', updateTime);
	});
</script>

<div class="flex flex-col items-center w-full min-h-screen max-w-xs sm:max-w-xl">
	<!-- Waveform Display -->
	<div id="waveform" class="w-full"></div>

	<!-- Media Controls -->
	<div class="flex items-center w-full sm:w-96 bg-gray-100 px-4 py-2 rounded-lg mt-10 shadow-md">
		<!-- Skip Backward Button -->
		<button onclick={skipBackward} class="text-gray-700 hover:text-gray-900 text-xl mr-1">
			<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faBackward} />
		</button>

		<!-- Play/Pause Button -->
		<button onclick={togglePlay} class="text-gray-700 hover:text-gray-900 text-2xl">
			{#if isPlaying}
				<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faPause} />
			{:else}
				<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faPlay} />
			{/if}
		</button>

		<!-- Skip Forward Button -->
		<button onclick={skipForward} class="text-gray-700 hover:text-gray-900 text-xl ml-1">
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
			oninput={changeVolume}
		/>
	</div>

	<!-- Region Controls -->
	<div class="flex flex-col items-center w-full sm:w-96 rounded-lg mt-2">
		<!-- Add Region Button -->
		<div>
			<button
				onclick={addRegion}
				class="bg-blue-500 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-2 mb-2 rounded"
			>
				Add Region
			</button>
			<button
				onclick={addRegion}
				class="bg-blue-500 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-2 mb-2 rounded"
			>
				Submit and Load next clip
			</button>
		</div>

		{#each regionsList as region (region.id)}
			<RegionCard
				{region}
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
