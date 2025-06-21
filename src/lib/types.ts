export interface RegionType {
	id: string;
	start: number;
	end: number;
	color: string;
	annotation: string;
	comment?: string; // Added comment field
}

export interface MousePosition {
	x: number;
	y: number;
	timestamp: number;
}

export interface AnnotationData {
	audioFileId: string;
	annotatedBy: string;
	annotations: {
		start: number;
		end: number;
		annotation: string;
	}[];
	aiClasses: any[];
	aiAnnotations: any[];
	interfaceVersion: number;
	labelingTime: number;
	mousePath: MousePosition[];
	hoverDurations: Record<string, number>;
	aiHoverCount: number;
	clickDelays: number[];
}

export interface AudioFileMetadata {
	id: string;
	filePath?: string;
	fileName?: string;
	fileUrl: string;
	annotated: boolean;
}
