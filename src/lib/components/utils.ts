export const random = (min: number, max: number) => Math.random() * (max - min) + min;
export const randomColor = () =>
	`rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

// Formats a time in seconds to min:sec.ms format
export function formatTime(seconds: number) {
	const min = Math.floor(seconds / 60);
	const sec = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 1000);
	return `${min}:${sec < 10 ? '0' : ''}${sec}.${ms.toString().padStart(3, '0')}`;
}
