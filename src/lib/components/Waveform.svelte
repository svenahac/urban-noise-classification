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
	import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
	import RegionCard from './RegionCard.svelte';

	type RegionType = {
		id: string;
		start: number;
		end: number;
		color: string;
		annotation: string;
	};

	type AnnotationData = {
		audio_url: string;
		annotations: {
			start: number;
			end: number;
			annotation: string;
		}[];
	};

	let { url = undefined } = $props();
	let ws: WaveSurfer;
	let regions: any;
	let isPlaying = $state(false);
	let volume = $state(1);
	let currentTime = $state('0:00.000');
	let duration = $state('0:00.000');
	let regionsList = $state<RegionType[]>([]);
	let currentAudioUrl = $state(url);
	let sessionAnnotations: AnnotationData[] = $state([]);
	const skipAmount = 0.05;
	const random = (min: number, max: number) => Math.random() * (max - min) + min;
	const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

	function formatTime(seconds: number) {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		const ms = Math.floor((seconds % 1) * 1000);
		return `${min}:${sec < 10 ? '0' : ''}${sec}.${ms.toString().padStart(3, '0')}`;
	}

	function updateRegionAnnotation(regionId: string, annotation: string) {
		regionsList = regionsList.map((region) =>
			region.id === regionId ? { ...region, annotation } : region
		);
	}

	function togglePlay() {
		if (ws) {
			ws.playPause();
			isPlaying = !isPlaying;
		}
	}

	function skipForward() {
		if (ws) {
			ws.setTime(ws.getCurrentTime() + skipAmount);
			updateTime();
		}
	}

	function skipBackward() {
		if (ws) {
			ws.setTime(Math.max(0, ws.getCurrentTime() - skipAmount));
			updateTime();
		}
	}

	function changeVolume(event: Event) {
		if (ws) {
			const target = event.target as HTMLInputElement;
			volume = parseFloat(target.value);
			ws.setVolume(volume);
		}
	}

	function updateTime() {
		if (ws) {
			currentTime = formatTime(ws.getCurrentTime());
		}
	}

	function addRegion() {
		if (ws) {
			const start = ws.getCurrentTime();
			const end = start + 2;
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

	async function loadNewClip() {
		// Validate that all regions have annotations
		const validRegions = regionsList.filter((region) => region.annotation.trim() !== '');

		if (validRegions.length !== regionsList.length) {
			alert('Please select a class for each region.');
			return;
		}

		if (validRegions.length === 0) {
			alert('Please add at least one region.');
			return;
		}

		// Prepare the JSON structure
		const annotationData: AnnotationData = {
			audio_url: currentAudioUrl,
			annotations: validRegions.map((region) => ({
				start: parseFloat(region.start.toFixed(6)),
				end: parseFloat(region.end.toFixed(6)),
				annotation: region.annotation
			}))
		};

		// Add to session annotations
		sessionAnnotations = [...sessionAnnotations, annotationData];

		try {
			// Load next clip
			const nextClip = await getRandomAudioClip();
			if (nextClip) {
				// Destroy existing wavesurfer instance
				ws.destroy();

				// Reset state
				currentAudioUrl = nextClip;
				regionsList = [];
				isPlaying = false;
				currentTime = '0:00.000';
				duration = '0:00.000';

				// Recreate wavesurfer instance with new audio
				initWaveSurfer(nextClip);
			}
		} catch (error) {
			console.error('Error loading next clip:', error);
			alert('Failed to load next audio clip.');
		}
	}

	function finishSession() {
		if (sessionAnnotations.length === 0) {
			alert('No annotations to download.');
			return;
		}

		try {
			// Generate and download JSON file with all session annotations
			const jsonBlob = new Blob([JSON.stringify(sessionAnnotations, null, 2)], {
				type: 'application/json'
			});
			const jsonUrl = URL.createObjectURL(jsonBlob);

			// Create a temporary link to download the file
			const link = document.createElement('a');
			link.href = jsonUrl;
			link.download = `session_annotations_${Date.now()}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Reset session annotations
			sessionAnnotations = [];

			alert('Session annotations downloaded successfully!');
		} catch (error) {
			console.error('Error generating session JSON:', error);
			alert('Failed to generate session annotation file.');
		}
	}

	function initWaveSurfer(audioUrl: string) {
		// Create the WaveSurfer instance
		ws = WaveSurfer.create({
			container: '#waveform',
			waveColor: '#d3cecd',
			progressColor: '#005cc8',
			url: audioUrl,
			dragToSeek: true,
			barHeight: 5,
			plugins: [],
			sampleRate: 16000
		});

		// Initialize the regions plugin and attach it to WaveSurfer
		regions = RegionsPlugin.create();
		ws.registerPlugin(regions);

		// Handle events after the audio is ready
		ws.on('ready', () => {
			duration = formatTime(ws.getDuration());
			updateTime();
		});

		// Update time during playback
		ws.on('audioprocess', updateTime);
		ws.on('seeking', updateTime);
	}

	onMount(async () => {
		// If url is not provided, get a random audio clip
		if (!currentAudioUrl) {
			currentAudioUrl = await getRandomAudioClip();
		}

		// Initialize WaveSurfer
		initWaveSurfer(currentAudioUrl);
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
		<!-- Action Buttons -->
		<div class="mb-2">
			<button
				onclick={addRegion}
				class="bg-blue-500 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded"
			>
				Add Region
			</button>
			<button
				onclick={loadNewClip}
				class="bg-green-500 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded"
			>
				Load New Clip
			</button>
			<button
				onclick={finishSession}
				class="bg-red-500 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded"
			>
				Finish Session
			</button>
		</div>

		{#each regionsList as region (region.id)}
			<RegionCard
				{region}
				onAnnotationChange={(id: string, annotation: string) => {
					updateRegionAnnotation(id, annotation);
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
