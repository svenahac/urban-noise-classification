import axios from 'axios';
import { env } from '$env/dynamic/public';

// Define your API endpoint for audio files
const API_URL = env.PUBLIC_API_URL; // Ensure this is correctly defined

export async function getRandomAudioClip(userId: string): Promise<any> {
	try {
		const url = `${API_URL}/clip/random/file?userId=${encodeURIComponent(userId)}`;

		// Make the request with Axios
		const response = await axios.get(url, {
			responseType: 'blob' // Ensures the audio file is treated as a binary stream
		});

		// Extract headers
		const headers = response.headers;

		// Extract metadata from headers
		return {
			id: headers['x-audio-id'], // Headers are case insensitive, but use lowercase for safety
			url: URL.createObjectURL(response.data), // Create an object URL for the file
			filePath: headers['x-audio-filepath'],
			annotated: parseInt(headers['x-audio-annotated'] || '0') // Convert string to number
		};
	} catch (error) {
		console.error('Error fetching random audio clip:', error);
		throw new Error('Failed to fetch audio clip');
	}
}
