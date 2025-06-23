import { getRandomAudioClip } from '$lib/audioLoader';
import type { RegionType, AnnotationData } from '$lib/types';
import { randomColor } from './utils';
import WaveSurfer from 'wavesurfer.js';
import { initWaveSurfer } from './waveform-actions';
import axios from 'axios';
import { env } from '$env/dynamic/public';
import { userStore } from '../../stores/userStore';
import authApi from '$lib/api/auth';
import { mouseTrackingStore } from '$lib/stores/mouseTrackingStore';

const API_URL = env.PUBLIC_API_URL;

interface AIRegion {
	start: number;
	end: number;
	annotation: string;
}

interface MousePosition {
	x: number;
	y: number;
	timestamp: number;
}

/*
let userToken: string | null = null;
const unsubscribe = userStore.subscribe((userState: { token: string | null }) => {
	userToken = userState.token;
});
*/
export function updateRegionAnnotation(
	regionsList: RegionType[],
	regionId: string,
	annotation: string
): RegionType[] {
	return regionsList.map((region) => (region.id === regionId ? { ...region, annotation } : region));
}

export function addRegion(ws: WaveSurfer, regions: any, regionsList: RegionType[]): RegionType[] {
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

		const newRegionsList = [...regionsList, { id, start, end, color, annotation: '' }];

		region.on('remove', () => {
			// This will be handled in the Waveform component
		});

		region.on('update-end', () => {
			// This will be handled in the Waveform component
		});

		return newRegionsList;
	}

	return regionsList;
}

export function createAIRegions(ws: WaveSurfer, regions: any, aiRegions: AIRegion[]): RegionType[] {
	const regionsList: RegionType[] = [];
	
	aiRegions.forEach((aiRegion) => {
		const color = randomColor();
		const id = `region-${Date.now()}-${Math.random()}`;

		try {
			const region = regions.addRegion({
				id: id,
				start: aiRegion.start,
				end: aiRegion.end,
				color: color,
				drag: true,
				resize: true
			});

			regionsList.push({
				id,
				start: aiRegion.start,
				end: aiRegion.end,
				color,
				annotation: aiRegion.annotation
			});

			region.on('remove', () => {
				// This will be handled in the Waveform component
			});

			region.on('update-end', () => {
				// This will be handled in the Waveform component
			});
		} catch (error) {
			console.error('Error creating region:', error);
		}
	});

	return regionsList;
}

export async function loadNewClip(
	ws: WaveSurfer,
	regions: any,
	regionsList: RegionType[],
	currentAudioId: string,
	sessionAnnotations: AnnotationData[],
	setCurrentAudioUrl: (url: string) => void,
	setCurrentAudioId: (id: string) => void,
	setCurrentTime: (time: string) => void,
	setDuration: (duration: string) => void,
	setIsPlaying: (isPlaying: boolean) => void,
	onTimeUpdate: (time: string) => void,
	onDurationSet: (duration: string) => void,
	userId: string,
	username: string,
	labelingStartTime: number | null,
	aiClasses: any[],
	aiRegions: any[],
	interfaceVersion: number,
	mouseTracking: any
) {
	// Calculate labeling time in seconds
	const labelingTime = labelingStartTime ? (Date.now() - labelingStartTime) / 1000 : 0;

	// Get mouse tracking data
	let mouseTrackingData = {
		mousePath: [] as MousePosition[],
		hoverDurations: {} as Record<string, number>,
		aiHoverCount: 0,
		clickDelays: [] as number[],
		fileLoadTime: null as number | null
	};
	mouseTracking.subscribe((data: any) => {
		mouseTrackingData = {
			mousePath: data.mousePath,
			hoverDurations: data.hoverDurations,
			aiHoverCount: data.aiHoverCount,
			clickDelays: data.clickDelays,
			fileLoadTime: data.fileLoadTime
		};
	})();

	// Calculate click delays relative to file load time
	const clickDelays = mouseTrackingData.fileLoadTime 
		? mouseTrackingData.clickDelays.map(timestamp => (timestamp - mouseTrackingData.fileLoadTime!) / 1000)
		: [];

	// Prepare the JSON structure
	const annotationData: AnnotationData = {
		audioFileId: currentAudioId,
		annotatedBy: userId,
		annotations: regionsList.map((region) => ({
			start: parseFloat(region.start.toFixed(6)),
			end: parseFloat(region.end.toFixed(6)),
			annotation: region.annotation || ''
		})),
		aiClasses: aiClasses || [],
		aiAnnotations: aiRegions || [],
		interfaceVersion: interfaceVersion || 0,
		labelingTime: labelingTime || 0,
		mousePath: mouseTrackingData.mousePath,
		hoverDurations: mouseTrackingData.hoverDurations,
		aiHoverCount: mouseTrackingData.aiHoverCount,
		clickDelays: clickDelays
	};

	let token: string | null = null;
	userStore.subscribe((value) => {
		token = value.token || localStorage.getItem('auth_token');
	})();

	try {
		const response = await axios.post(API_URL + '/annotation', annotationData, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		// If successfully saved, then load the next clip
		let newaudioUrl = await getRandomAudioClip(userId, username);
		if (newaudioUrl && newaudioUrl.url) {
			// Destroy existing wavesurfer instance
			ws.destroy();

			// Return the new audio data
			return {
				audioUrl: newaudioUrl.url,
				audioId: newaudioUrl.id,
				aiClasses: newaudioUrl.aiClasses ,
				aiRegions: newaudioUrl.aiRegions ,
				interface: newaudioUrl.interface ,
				sessionAnnotations: sessionAnnotations
			};
		} else {
			alert('No more unannotated audio clips available.');
			return null;
		}
	} catch (error) {
		console.error('Error saving annotation or loading next clip:', error);
		alert('Failed to save annotations or load next audio clip.');
		return null;
	}
}
