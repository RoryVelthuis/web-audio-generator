<script>
    import { onMount } from 'svelte';
    import { frequency, note, octave } from '$lib/stores';
    import { getClosestNoteFromFrequency, generateNoteFrequencies } from '$lib/notes';

    let isAudioSupported = true;
    let isAudioStarted = false;
    let noteFrequencyMap;

    let useBitcrusher = false;

    let audioCtx;
    let oscillator;
    let gainNode;
    let bitcrusherNode;
    let bitDepth = 4; // Default bit depth
    let sampleRateReduction = 8; // Default sample rate reduction
    let waveform = 'sine';
    let gainLevel = 0.5;


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

    function setGain(gain) {
        if (gainNode) {
            gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
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

    async function initializeAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            await audioCtx.audioWorklet.addModule('src/lib/bitcrusher-processor.js');
            console.log('Audio context initialized');
            console.log('Bitcrusher processor added');         
            console.log('Audio context state:', audioCtx.state);
            console.log('Audio context sample rate:', audioCtx.sampleRate);
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
            console.log('Audio context already initialized. Resuming...');
            console.log('Audio context state:', audioCtx.state);
            console.log('Audio context sample rate:', audioCtx.sampleRate);
        }
    }

    function disconnectAudioNodes() {
        if (oscillator) {
            oscillator.disconnect();
        }
        if (gainNode) {
            gainNode.disconnect();
        }
        if (bitcrusherNode) {
            bitcrusherNode.disconnect();
        }
    }

    function createAudioNodes() {
        // Disconnect and clear previous nodes if they exist
        disconnectAudioNodes();

        // Create an oscillator node
        oscillator = audioCtx.createOscillator();
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime($frequency, audioCtx.currentTime);

        // Create a gain node
        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

        // If bitcrusher is enabled, create the bitcrusher node
        if(useBitcrusher) {
            bitcrusherNode = new AudioWorkletNode(audioCtx, 'bitcrusher-processor', {
                parameterData: {
                    bitDepth: bitDepth,
                    sampleRateReduction: sampleRateReduction
                }
            });
            // Connect the nodes: Oscillator -> Bitcrusher -> Gain -> Destination
            oscillator.connect(bitcrusherNode).connect(gainNode).connect(audioCtx.destination);
        } else {
            // Connect the nodes: Oscillator -> Gain -> Destination (no bitcrusher)
            oscillator.connect(gainNode).connect(audioCtx.destination);
        }
    }

    async function startAudio() {
        await initializeAudioContext();
        createAudioNodes();
        oscillator.start();

        isAudioStarted = true;
    }

    function stopAudio() {
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
        isAudioStarted = false;
    }

        // Reactive statement to restart audio when useBitcrusher changes
    $: if (audioCtx && isAudioStarted) {
        // Reconnect the nodes when bitcrusher toggled
        disconnectAudioNodes();
        if (useBitcrusher && !bitcrusherNode) {
            bitcrusherNode = new AudioWorkletNode(audioCtx, 'bitcrusher-processor', {
                parameterData: { bitDepth, sampleRateReduction }
            });
        }
        if (useBitcrusher) {
            oscillator.connect(bitcrusherNode).connect(gainNode).connect(audioCtx.destination);
        } else {
            oscillator.connect(gainNode).connect(audioCtx.destination);
        }
    }

    onMount(async () => {
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
        <input type="range" min="1" max="6000" step="1" bind:value={$frequency} on:input={updateFrequency} />
        <input type="number" min="1" max="6000" step="1" bind:value={$frequency} on:input={updateFrequency} />
        <span>hz</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={gainLevel} on:change={() => setGain(gainLevel)} />
        <span>{gainLevel}</span>
        <label>
            <input type="checkbox" bind:checked={useBitcrusher} />
            Use Bitcrusher: {useBitcrusher}
        </label>
        <input type="range" min="1" max="16" step="1" bind:value={bitDepth} on:change={() => bitcrusherNode.port.postMessage({ bitDepth })} />
        <input type="range" min="1" max="16" step="1" bind:value={sampleRateReduction} on:change={() => bitcrusherNode.port.postMessage({ sampleRateReduction })} />
    {:else}
        <div>Your browser does not support the Web Audio API.</div>
    {/if}
</main>