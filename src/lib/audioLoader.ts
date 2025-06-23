import axios from 'axios';
import { env } from '$env/dynamic/public';
import defaultClasses from '$lib/assets/classes.json';

// Define your API endpoint for audio files
const API_URL = env.PUBLIC_API_URL; // Ensure this is correctly defined

interface AIClass {
	label: string;
	prob: number;
}

interface AIRegion {
	start: number;
	end: number;
	annotation: string;
}

const markoUsers = [
	'user1',
	'user2',
	'user3',
	'user4',
	'user5',
	'user6',
	'user7',
	'user8',
	'user9',
	'user10',
	'user11',
	'user12',
	'user13',
	'user14',
	'user15',
	'user16',
	'user17',
	'user18',
	'user19',
	'user20',
	'user21',
	'user22',
	'user23',
	'user24',
	'user25',
	'user26',
	'user27',
	'user28',
	'user29',
	'user30',
];

export async function getRandomAudioClip(userId: string, username?: string): Promise<any> {
	try {
		// Use /marko endpoint if username is in markoUsers array, otherwise use /random/file
		const endpoint = username && markoUsers.includes(username) ? 'marko' : 'random/file';
		let url = `${API_URL}/clip/${endpoint}?userId=${encodeURIComponent(userId)}`;
		if (username) {
			url += `&username=${encodeURIComponent(username)}`;
		}

		// Make the request with Axios
		const response = await axios.get(url, {
			responseType: 'blob' // Ensures the audio file is treated as a binary stream
		});
		// Extract headers
		const headers = response.headers;
		console.log(headers);
		// Get AI classes and interface value
		const aiClassesStr = headers['x-ai-classes'];
		const aiClasses = aiClassesStr ? (JSON.parse(aiClassesStr) as AIClass[]) : [];
		const interfaceValue = parseInt(headers['x-ai-interface'] || '0');
		const aiRegionsStr = headers['x-ai-regions'];
		const aiRegions = aiRegionsStr ? (JSON.parse(aiRegionsStr) as AIRegion[]) : [];
		// Initialize classes with default classes
		let classes = defaultClasses.map((name) => ({ name }));

		// If interface is 1 and we have AI classes, add them to the top
		if (interfaceValue === 1 && aiClasses.length > 0) {
			const aiClassNames = aiClasses.map((c: AIClass) => ({ name: c.label }));
			// Remove any duplicates from the existing list
			const existingNames = new Set(aiClassNames.map((c) => c.name));
			const filteredClasses = classes.filter((c) => !existingNames.has(c.name));
			// Add AI classes to the top
			classes = [...aiClassNames, ...filteredClasses];
		}

		// Extract metadata from headers
		return {
			id: headers['x-audio-id'], // Headers are case insensitive, but use lowercase for safety
			url: URL.createObjectURL(response.data), // Create an object URL for the file
			filePath: headers['x-audio-filepath'],
			annotated: parseInt(headers['x-audio-annotated'] || '0'), // Convert string to number
			interface: interfaceValue,
			aiClasses: aiClasses,
			aiRegions: aiRegions,
			classes: classes // Add the processed classes to the return object
		};
	} catch (error) {
		console.error('Error fetching random audio clip:', error);
		throw new Error('Failed to fetch audio clip');
	}
}
