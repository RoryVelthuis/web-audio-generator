import { writable } from "svelte/store";

export const frequency = writable(50);
export const note = writable("A");
export const octave = writable(4);
export const gain = writable(0.5);
export const waveform = writable("sine");
export const useBitcrusher = writable(false);
export const bitcrusherSettings = writable({ bitDepth: 8, sampleRateReduction: 4 });

