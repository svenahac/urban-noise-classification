export interface RegionType {
	id: string;
	start: number;
	end: number;
	color: string;
	annotation: string;
	comment?: string; // Added comment field
}

export interface AnnotationData {
	audioFileId: string;
	annotatedBy: string;
	annotations: {
		start: number;
		end: number;
		annotation: string;
		comment?: string; // Added comment field
	}[];
}
export interface AudioFileMetadata {
	id: string;
	filePath?: string;
	fileName?: string;
	fileUrl: string;
	annotated: boolean;
}
