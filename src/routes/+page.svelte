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
        gainNode.gain.setValueAtTime(gainLevel, audioCtx.currentTime);

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

        <div class="controls-panel">
 
    
    
            <fieldset>
                <legend>Tone</legend>

                <!-- Playback button -->
                <div class="control-group">
                    {#if !isAudioStarted}
                        <button class="audio-button play-button" on:click={startAudio}></button>
                    {/if}
                    {#if isAudioStarted}
                        <button class="audio-button stop-button" on:click={stopAudio}></button>
                    {/if}
                </div>

                <!-- Frequency adjust -->
                <div class="control-group">
                    <label for="frequency-number">Frequency:</label>
                    <input id="frequency-slider" name="frequency-slider" type="range" min="1" max="6000" step="1" bind:value={$frequency} on:input={updateFrequency} />
                    <input id="frequency-number" name="frequency-number" type="number" min="1" max="6000" step="1" bind:value={$frequency} on:input={updateFrequency} />
                    <span>hz</span>
                </div>
    
                <!-- Note selection -->
                <div class="control-group">
                    <label for="note-select">Note:</label>
                    <select id="note-select" name="note-select" bind:value={$note} on:change={updateNoteOrOctave}>
                        {#each notes as { note }}
                            <option value={note}>{note}</option>
                        {/each}
                    </select>
                    <label for="octave-select">Octave:</label>
                    <select id="octave-select" name="octave-select" bind:value={$octave} on:change={updateNoteOrOctave}>
                        {#each Array.from({ length: 10 }, (_, i) => i) as i}
                            <option value={i}>{i}</option>
                        {/each}
                    </select>
                </div>
    
                <!-- Waveform selection -->
                <div class="control-group">
                    <label for="waveform-select">Waveform:</label>
                    <select id="waveform-select" name="waveform-select" bind:value={waveform} on:change={() => setWaveform(waveform)}>
                        {#each waveforms as { waveform }}
                            <option value={waveform}>{waveform}</option>
                        {/each}
                    </select>
                </div>
            </fieldset>
    
            <!-- Volume/Gain adjust -->
            <fieldset>
                <div class="control-group">
                    <label for="gain-slider">Volume (Gain): </label>
                    <input id="gain-slider" type="range" min="0" max="1" step="0.01" bind:value={gainLevel} on:change={() => setGain(gainLevel)} />
                    <span>{gainLevel}</span>
                </div>
            </fieldset>
    
            <!-- Bitcrusher process controls -->
            <fieldset>
                <legend>Bitcrusher</legend>
                <div class="control-group">
                    <label for="bitcrush-checkbox">Use Bitcrusher:</label>
                    <input id="bitcrush-checkbox" name="bitcrush-toggle" type="checkbox" bind:checked={useBitcrusher} />
                </div>
    
                <div class="control-group">
                    <label for="bit-depth-slider">Bit depth: </label>
                    <input id="bit-depth-slider" name="bit-depth" type="range" min="1" max="16" step="1" bind:value={bitDepth} on:change={() => bitcrusherNode.port.postMessage({ bitDepth })} />
                </div>
    
                <div class="control-group">
                    <label for="sample-rate-reduction-slider">Sample rate reduction:</label>
                    <input id="sampe-rate-reduction-slider" name="sampe-rate-reduction-slider" type="range" min="1" max="16" step="1" bind:value={sampleRateReduction} on:change={() => bitcrusherNode.port.postMessage({ sampleRateReduction })} />
                </div>
            </fieldset>
        </div>
        
    
        {:else}
        <div>Your browser does not support the Web Audio API.</div>
    {/if}
</main>

<style>
    fieldset {
        border: 1px solid #ccc;
        padding: 10px;
        margin-bottom: 20px;
        border-radius: 5px;
    }

    .control-group {
        margin-bottom: 15px;
    }

    .control-group label {
        display: block;
        margin-bottom: 5px;
    }

    .control-group input,
    .control-group select {
        margin-bottom: 10px;
        width: 100%;
    }

    .control-group span {
        display: block;
        margin-top: -10px;
        margin-bottom: 10px;
    }

    .audio-button {
        width: 50px;
        height: 50px;
        cursor: pointer;
        position: relative;
    }

    .audio-button::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .play-button::before {
        width: 0;
        height: 0;
        border-left: 20px solid green;
        border-top: 12.5px solid transparent;
        border-bottom: 12.5px solid transparent;
    }

    .stop-button::before {
        width: 20px;
        height: 20px;
        background-color: red;
    }
</style>