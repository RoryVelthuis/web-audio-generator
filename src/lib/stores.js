import { writable } from "svelte/store";

export const frequency = writable(50);
export const note = writable("A");
export const octave = writable(4);
export const gain = writable(0.5);
export const waveform = writable("sine");
export const useBitcrusher = writable(false);
export const bitcrusherSettings = writable({ bitDepth: 8, sampleRateReduction: 4 });

export const attack = writable(0.1);
export const decay = writable(0.2);
export const sustain = writable(0.5);
export const release = writable(0.3);

export const useOvertones = writable(false);
export const numberOfOvertones = writable(5);
export const overtones = writable([]);