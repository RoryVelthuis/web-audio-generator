import { writable } from "svelte/store";

export const frequency = writable(50);

export const note = writable("A");
export const octave = writable(4);