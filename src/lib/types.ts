export type RegionType = {
	id: string;
	start: number;
	end: number;
	color: string;
	annotation: string;
};

export type AnnotationData = {
	audioFileId: string;
	annotatedBy: string;
	annotations: {
		start: number;
		end: number;
		annotation: string;
	}[];
};

export interface AudioFileMetadata {
	id: string;
	filePath?: string;
	fileName?: string;
	fileUrl: string;
	annotated: boolean;
}
