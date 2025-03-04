<script lang="ts">
	import Waveform from '$lib/components/Waveform.svelte';
	import demo from '$lib/assets/demo.wav';
</script>

<div class="flex flex-col items-center pt-10">
	<!-- Pass URL as prop -->
	<Waveform url={demo} />
</div>
