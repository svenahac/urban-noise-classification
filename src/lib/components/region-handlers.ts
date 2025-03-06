import { getRandomAudioClip } from '$lib/audioLoader';
import type { RegionType, AnnotationData } from '$lib/types';
import { randomColor } from './utils';
import WaveSurfer from 'wavesurfer.js';
import { initWaveSurfer } from './waveform-actions';

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

export async function loadNewClip(
	ws: WaveSurfer,
	regions: any,
	regionsList: RegionType[],
	currentAudioUrl: string,
	sessionAnnotations: AnnotationData[],
	setCurrentAudioUrl: (url: string) => void,
	setCurrentTime: (time: string) => void,
	setDuration: (duration: string) => void,
	setIsPlaying: (isPlaying: boolean) => void,
	onTimeUpdate: (time: string) => void,
	onDurationSet: (duration: string) => void
) {
	// Validate that all regions have annotations
	const validRegions = regionsList.filter((region) => region.annotation.trim() !== '');

	if (validRegions.length !== regionsList.length) {
		alert('Please select a class for each region.');
		return { ws, regions, regionsList, sessionAnnotations };
	}

	if (validRegions.length === 0) {
		alert('Please add at least one region.');
		return { ws, regions, regionsList, sessionAnnotations };
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
	const newSessionAnnotations = [...sessionAnnotations, annotationData];

	try {
		// Load next clip
		const nextClip = await getRandomAudioClip();
		if (nextClip) {
			// Destroy existing wavesurfer instance
			ws.destroy();

			// Reset state
			setCurrentAudioUrl(nextClip);
			setIsPlaying(false);
			setCurrentTime('0:00.000');
			setDuration('0:00.000');

			// Recreate wavesurfer instance with new audio
			const { ws: newWs, regions: newRegions } = initWaveSurfer(
				nextClip,
				onTimeUpdate,
				onDurationSet
			);
			return {
				ws: newWs,
				regions: newRegions,
				regionsList: [],
				sessionAnnotations: newSessionAnnotations
			};
		}
	} catch (error) {
		console.error('Error loading next clip:', error);
		alert('Failed to load next audio clip.');
	}

	return { ws, regions, regionsList, sessionAnnotations };
}

export function finishSession(sessionAnnotations: AnnotationData[]): AnnotationData[] {
	if (sessionAnnotations.length === 0) {
		alert('No annotations to download.');
		return sessionAnnotations;
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

		alert('Session annotations downloaded successfully!');
		return [];
	} catch (error) {
		console.error('Error generating session JSON:', error);
		alert('Failed to generate session annotation file.');
		return sessionAnnotations;
	}
}
