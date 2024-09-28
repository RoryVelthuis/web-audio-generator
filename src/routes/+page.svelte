<script>
    import { onMount } from 'svelte';
    import { frequency, note, octave } from '$lib/stores';
    import { getClosestNoteFromFrequency, generateNoteFrequencies } from '$lib/notes';

    let audioCtx;
    let oscillator;
    let gainNode;
    let isAudioSupported = true;
    let isAudioStarted = false;
    let noteFrequencyMap;

    let waveform = 'sine';

    const notes = [
        { note: 'C' },
        { note: 'C#' },
        { note: 'D' },
        { note: 'D#' },
        { note: 'E' },
        { note: 'F' },
        { note: 'F#' },
        { note: 'G' },
        { note: 'G#' },
        { note: 'A' },
        { note: 'A#' },
        { note: 'B' }
    ];

    const waveforms = [
        { waveform: 'sine' },
        { waveform: 'square' },
        { waveform: 'sawtooth' },
        { waveform: 'triangle' }
    ];

    function updateFrequency(event) {
        let freq = event.target.value;
        frequency.set(freq);
        if (oscillator) {
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        }

        // Update note and octave if the frequency matches a predefined note
        const closestNote = getClosestNoteFromFrequency(freq, noteFrequencyMap);

        const matchedNote = closestNote.slice(0, -1); // All characters except the last one
        const matchedOctave = parseInt(closestNote.slice(-1)); // The last character as an integer
        if (matchedNote && matchedOctave !== undefined) {
            note.set(matchedNote);
            octave.set(matchedOctave);
        }
    }

    function setFrequency(freq) {
        frequency.set(freq);
        if (oscillator) {
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        }
    }

    function setWaveform(waveform) {
        if (oscillator) {
            oscillator.type = waveform;
        }
    }

    function updateNoteOrOctave() {
        let combined = $note + $octave;

        console.log(`Note: ${$note}, Octave: ${$octave}`);
        console.log(`Note: ${combined}`);

        let freq = noteFrequencyMap[combined];
        console.log(`Setting frequency to ${freq}`);

        setFrequency(freq);
    }

    function startAudio() {
        if (!audioCtx) {
            // Initialize the audio context
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // Create an oscillator node
            oscillator = audioCtx.createOscillator();
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(50, audioCtx.currentTime);

            // Create a gain node
            gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

            // Connect the oscillator to the gain node and the gain node to the audio context's destination
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            // Start the oscillator
            oscillator.start();
        } else if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isAudioStarted = true;
    }

    function stopAudio() {
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
        isAudioStarted = false;
    }



    onMount(() => {
        if (!window.AudioContext && !window.webkitAudioContext) {
            isAudioSupported = false;
            return;
        }

        noteFrequencyMap = generateNoteFrequencies();

    });

</script>

<main>
    {#if isAudioSupported}
        {#if !isAudioStarted}
            <button on:click={startAudio}>Start Audio</button>
        {/if}
        {#if isAudioStarted}
            <button on:click={stopAudio}>Stop Audio</button>
        {/if}
        <select bind:value={waveform} on:change={() => setWaveform(waveform)}>
            {#each waveforms as { waveform }}
                <option value={waveform}>{waveform}</option>
            {/each}
        </select>
        <select bind:value={$note} on:change={updateNoteOrOctave}>
            {#each notes as { note }}
                <option value={note}>{note}</option>
            {/each}
        </select>
        <select bind:value={$octave} on:change={updateNoteOrOctave}>
            {#each Array.from({ length: 10 }, (_, i) => i) as i}
                <option value={i}>{i}</option>
            {/each}
        </select>
        <input type="range" min="1" max="15804" step="1" bind:value={$frequency} on:input={updateFrequency} />
        <input type="number" min="1" max="15804" step="1" bind:value={$frequency} on:input={updateFrequency} />
        <span>hz</span>
    {:else}
        <div>Your browser does not support the Web Audio API.</div>
    {/if}
</main>