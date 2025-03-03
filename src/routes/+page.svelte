<script lang="ts">
	import { onMount } from 'svelte';
	import WaveSurfer from 'wavesurfer.js';
	import demo from '$lib/assets/spectrogram_demo_doorknock_mono.wav';
	let wavesurfer: WaveSurfer;

	onMount(() => {
		wavesurfer = WaveSurfer.create({
			container: '#waveform',
			waveColor: '#4F4A85',
			progressColor: '#383351',
			url: demo
		});
		wavesurfer.on('interaction', () => {
			wavesurfer.play();
		});
	});
</script>

<div class="mx-8 flex flex-col items-center pt-28">
	<div id="waveform" class="w-full h-64"></div>
</div>
