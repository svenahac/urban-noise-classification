import { getRandomAudioClip } from '$lib/audioLoader';
import type { RegionType, AnnotationData } from '$lib/types';
import { randomColor } from './utils';
import WaveSurfer from 'wavesurfer.js';
import { initWaveSurfer } from './waveform-actions';
import axios from 'axios';
import { env } from '$env/dynamic/public';
import { userStore } from '../../stores/userStore';
import authApi from '$lib/api/auth';

const API_URL = env.PUBLIC_API_URL;

export function updateRegionAnnotation(
	regionsList: RegionType[],
	regionId: string,
	annotation: string
): RegionType[] {
	return regionsList.map((region) => (region.id === regionId ? { ...region, annotation } : region));
}

export function updateRegionComment(
	regionsList: RegionType[],
	regionId: string,
	comment: string
): RegionType[] {
	return regionsList.map((region) => (region.id === regionId ? { ...region, comment } : region));
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

		const newRegionsList = [...regionsList, { id, start, end, color, annotation: '', comment: '' }];

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
	currentAudioId: string,
	sessionAnnotations: AnnotationData[],
	setCurrentAudioUrl: (url: string) => void,
	setCurrentAudioId: (id: string) => void,
	setCurrentTime: (time: string) => void,
	setDuration: (duration: string) => void,
	setIsPlaying: (isPlaying: boolean) => void,
	onTimeUpdate: (time: string) => void,
	onDurationSet: (duration: string) => void,
	userId: string
) {
	// Validate that all regions have either annotations or comments
	const validRegions = regionsList.filter(
		(region) => region.annotation?.trim() !== '' || region.comment?.trim() !== ''
	);

	if (validRegions.length !== regionsList.length) {
		alert('Please provide either a class or comment for each region.');
		return { ws, regions, regionsList, sessionAnnotations };
	}

	if (validRegions.length === 0) {
		alert('Please add at least one region.');
		return { ws, regions, regionsList, sessionAnnotations };
	}

	// Prepare the JSON structure
	const annotationData: AnnotationData = {
		audioFileId: currentAudioId,
		annotatedBy: userId,
		annotations: validRegions.map((region) => ({
			start: parseFloat(region.start.toFixed(6)),
			end: parseFloat(region.end.toFixed(6)),
			annotation: region.annotation || '',
			comment: region.comment || ''
		}))
	};

	try {
		const isTokenValid = await authApi.verifyToken();

		if (isTokenValid) {
			await axios.post(API_URL + '/annotation', annotationData);
		}

		// If successfully saved, then load the next clip
		let newaudioUrl = await getRandomAudioClip(false);

		if (newaudioUrl && newaudioUrl.url) {
			// Destroy existing wavesurfer instance
			ws.destroy();

			// Reset state
			setCurrentAudioUrl(newaudioUrl.url);
			setCurrentAudioId(newaudioUrl.id);
			setIsPlaying(false);
			setCurrentTime('0:00.000');
			setDuration('0:00.000');

			// Recreate wavesurfer instance with new audio
			const { ws: newWs, regions: newRegions } = initWaveSurfer(
				newaudioUrl.url,
				onTimeUpdate,
				onDurationSet
			);

			// Keep existing session annotations (not adding the new one since it's saved to DB)
			return {
				ws: newWs,
				regions: newRegions,
				regionsList: [],
				sessionAnnotations: sessionAnnotations
			};
		} else {
			alert('No more unannotated audio clips available.');
			return { ws, regions, regionsList, sessionAnnotations };
		}
	} catch (error) {
		console.error('Error saving annotation or loading next clip:', error);
		alert('Failed to save annotations or load next audio clip.');
		return { ws, regions, regionsList, sessionAnnotations };
	}
}
