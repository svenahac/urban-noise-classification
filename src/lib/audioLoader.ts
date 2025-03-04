// src/lib/audioLoader.ts
import { browser } from '$app/environment';

export async function getRandomAudioClip(): Promise<string> {
	if (!browser) return ''; // Return empty string if not in browser environment

	try {
		// Use Vite's import.meta.glob to get all audio files in the directory
		const audioModules = import.meta.glob('/src/lib/assets/audio-examples/*.wav');
		const audioFiles = Object.keys(audioModules);

		if (audioFiles.length === 0) {
			console.error('No audio files found in the directory');
			return '';
		}

		// Select a random audio file
		const randomIndex = Math.floor(Math.random() * audioFiles.length);
		const randomAudioPath = audioFiles[randomIndex];

		// Dynamically import the audio file
		const audioModule = await audioModules[randomAudioPath]();
		return (audioModule as { default: string }).default;
	} catch (error) {
		console.error('Error loading random audio clip:', error);
		return '';
	}
}
