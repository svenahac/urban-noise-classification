import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { formatTime } from './utils';

// Constants
export const skipAmount = 0.05;

export function initWaveSurfer(
	audioUrl: string,
	onTimeUpdate: (time: string) => void,
	onDurationSet: (duration: string) => void
): { ws: WaveSurfer; regions: any } {
	// Create the WaveSurfer instance
	const ws = WaveSurfer.create({
		container: '#waveform',
		waveColor: '#ffffff',
		progressColor: '#3afa66',
		url: audioUrl,
		dragToSeek: true,
		barHeight: 2,
		plugins: [],
		sampleRate: 16000
	});

	// Initialize the regions plugin and attach it to WaveSurfer
	const regions = RegionsPlugin.create();
	ws.registerPlugin(regions);

	// Handle events after the audio is ready
	ws.on('ready', () => {
		onDurationSet(formatTime(ws.getDuration()));
		updateTime(ws, onTimeUpdate);
	});

	// Update time during playback
	ws.on('audioprocess', () => updateTime(ws, onTimeUpdate));
	ws.on('seeking', () => updateTime(ws, onTimeUpdate));

	ws.on('finish', () => {
		ws.setTime(0); // Set time back to the beginning
		ws.play(); // Start playing again
		updateTime(ws, onTimeUpdate);
	});

	return { ws, regions };
}

export function updateTime(ws: WaveSurfer, onTimeUpdate: (time: string) => void) {
	if (ws) {
		onTimeUpdate(formatTime(ws.getCurrentTime()));
	}
}

export function togglePlay(ws: WaveSurfer, setIsPlaying: (value: boolean) => void) {
	if (ws) {
		ws.playPause();
		setIsPlaying(ws.isPlaying());
	}
}

export function skipForward(ws: WaveSurfer, onTimeUpdate: (time: string) => void) {
	if (ws) {
		ws.setTime(ws.getCurrentTime() + skipAmount);
		updateTime(ws, onTimeUpdate);
	}
}

export function skipBackward(ws: WaveSurfer, onTimeUpdate: (time: string) => void) {
	if (ws) {
		ws.setTime(Math.max(0, ws.getCurrentTime() - skipAmount));
		updateTime(ws, onTimeUpdate);
	}
}

export function changeVolume(ws: WaveSurfer, event: Event) {
	if (ws) {
		const target = event.target as HTMLInputElement;
		const volumeValue = parseFloat(target.value);
		ws.setVolume(volumeValue);
	}
}
