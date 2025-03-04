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
	import { faBluesky } from '@fortawesome/free-brands-svg-icons';

	export let url: string; // Audio URL passed as a prop

	let ws: WaveSurfer;
	let isPlaying = false;
	let volume = 1; // Default volume (1 = 100%)
	let currentTime = '0:00.000';
	let duration = '0:00.000';
	const skipAmount = 0.05; // Skip 1/20th of a second

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

	onMount(() => {
		ws = WaveSurfer.create({
			container: '#waveform',
			waveColor: '#d3cecd',
			progressColor: '#005cc8',
			url: url,
			dragToSeek: true,
			height: 50
		});

		// Update time when the audio is ready
		ws.on('ready', () => {
			duration = formatTime(ws.getDuration());
			updateTime();
		});

		// Update time while playing
		ws.on('audioprocess', updateTime);

		// Update time when user seeks manually
		ws.on('seeking', updateTime);
	});
</script>

<div class="flex flex-col items-center w-full max-w-xs sm:max-w-xl">
	<!-- Waveform Display -->
	<div id="waveform" class="w-full bg-blue-500 rounded-md"></div>

	<!-- Media Controls -->
	<div class="flex items-center w-full sm:w-96 bg-gray-100 px-4 py-2 rounded-lg mt-10">
		<!-- Skip Backward Button -->
		<button on:click={skipBackward} class="text-gray-700 hover:text-gray-900 text-xl mr-1">
			<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faBackward} />
		</button>

		<!-- Play/Pause Button -->
		<button on:click={togglePlay} class="text-gray-700 hover:text-gray-900 text-2xl">
			{#if isPlaying}
				<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faPause} />
			{:else}
				<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faPlay} />
			{/if}
		</button>

		<!-- Skip Forward Button -->
		<button on:click={skipForward} class="text-gray-700 hover:text-gray-900 text-xl ml-1">
			<FontAwesomeIcon class="text-blue-500 hover:text-blue-700" icon={faForward} />
		</button>

		<!-- Time Display -->
		<span class="text-gray-700 text-sm ml-3">{currentTime} / {duration}</span>

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
			on:input={changeVolume}
		/>
	</div>

	<!-- Region Controls -->
	<div class="flex items-center w-full sm:w-96 rounded-lg mt-2">
		<!-- Add Region Button -->
		<button
			class="bg-blue-500 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-2 rounded"
		>
			Add Region
		</button>
	</div>
</div>
