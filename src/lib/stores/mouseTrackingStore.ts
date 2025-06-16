import { writable } from 'svelte/store';

interface MousePosition {
    x: number;
    y: number;
    timestamp: number;
}

interface MouseTrackingState {
    mousePath: MousePosition[];
    hoverDurations: Record<string, number>;
    aiHoverCount: number;
    clickDelays: number[];
    hoverStartTimes: Record<string, number>;
    lastMousePosition: string;
    lastMouseTrackTime: number;
    fileLoadTime: number | null;
}

function createMouseTrackingStore() {
    const { subscribe, set, update } = writable<MouseTrackingState>({
        mousePath: [],
        hoverDurations: {},
        aiHoverCount: 0,
        clickDelays: [],
        hoverStartTimes: {},
        lastMousePosition: '',
        lastMouseTrackTime: 0,
        fileLoadTime: null
    });

    return {
        subscribe,
        trackMouseMove: (x: number, y: number) => {
            update(state => {
                const now = Date.now();
                // Only track if 100ms have passed since last track
                if (now - state.lastMouseTrackTime >= 100) {
                    const newPath = [...state.mousePath, { x, y, timestamp: now }];
                    return { 
                        ...state, 
                        mousePath: newPath,
                        lastMouseTrackTime: now
                    };
                }
                return state;
            });
        },
        startHover: (elementId: string, isAIClass: boolean) => {
            update(state => {
                const hoverStartTimes = { ...state.hoverStartTimes, [elementId]: Date.now() };
                return { ...state, hoverStartTimes };
            });
        },
        endHover: (elementId: string, isAIClass: boolean) => {
            update(state => {
                const startTime = state.hoverStartTimes[elementId];
                if (startTime) {
                    const duration = Date.now() - startTime;
                    const hoverDurations = { ...state.hoverDurations };
                    hoverDurations[elementId] = (hoverDurations[elementId] || 0) + duration;
                    
                    const newState = { ...state, hoverDurations };
                    if (isAIClass) {
                        newState.aiHoverCount = state.aiHoverCount + 1;
                    }
                    return newState;
                }
                return state;
            });
        },
        trackClick: () => {
            update(state => {
                const clickDelays = [...state.clickDelays, Date.now()];
                return { ...state, clickDelays };
            });
        },
        setFileLoadTime: () => {
            update(state => ({
                ...state,
                fileLoadTime: Date.now()
            }));
        },
        reset: () => {
            set({
                mousePath: [],
                hoverDurations: {},
                aiHoverCount: 0,
                clickDelays: [],
                hoverStartTimes: {},
                lastMousePosition: '',
                lastMouseTrackTime: 0,
                fileLoadTime: null
            });
        }
    };
}

export const mouseTrackingStore = createMouseTrackingStore(); 