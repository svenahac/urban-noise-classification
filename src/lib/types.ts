export type RegionType = {
	id: string;
	start: number;
	end: number;
	color: string;
	annotation: string;
};

export type AnnotationData = {
	audio_url: string;
	annotations: {
		start: number;
		end: number;
		annotation: string;
	}[];
};
