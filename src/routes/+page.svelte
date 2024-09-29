<script>
    import { onMount } from 'svelte';
    import { frequency, note, octave, gain, waveform, useBitcrusher, bitcrusherSettings, attack, decay, sustain, release } from '$lib/stores';
    import { getClosestNoteFromFrequency, generateNoteFrequencies } from '$lib/notes';

    let isAudioSupported = true;
    let isAudioStarted = false;
    let noteFrequencyMap;

    let audioCtx;
    let oscillator;
    let gainNode;
    let bitcrusherNode;



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

    
    async function initializeAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            await audioCtx.audioWorklet.addModule('src/lib/bitcrusher-processor.js');
            console.log('Audio context initialized');
            console.log('Audio context state:', audioCtx.state);
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
            console.log('Audio context already initialized. Resuming...');
            console.log('Audio context state:', audioCtx.state);
        }
    }


    function createAudioNodes() {
        // Disconnect and clear previous nodes if they exist
        if (oscillator) oscillator.disconnect();
        if (gainNode) gainNode.disconnect();

        // Create an oscillator node
        console.log('Creating oscillator node');
        oscillator = audioCtx.createOscillator();
        oscillator.type = $waveform;
        oscillator.frequency.setValueAtTime($frequency, audioCtx.currentTime);

        // Create a gain node
        console.log('Creating gain node');
        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime($gain, audioCtx.currentTime);

        console.log('Connecting oscillator to gain node and gain node to destination');
        oscillator.connect(gainNode).connect(audioCtx.destination);


        // If bitcrusher is enabled, create the bitcrusher node
        // if ($useBitcrusher) {
        //     console.log('Bitcrusher is enabled, creating bitcrusher node');
        //     bitcrusherNode = new AudioWorkletNode(audioCtx, 'bitcrusher-processor', {
        //         parameterData: {
        //             bitDepth: $bitcrusherSettings.bitDepth,
        //             sampleRateReduction: $bitcrusherSettings.sampleRateReduction,
        //         }
        //     });
        //     console.log('disconnecting oscillator and connecting bitcrusher');
        //     oscillator.disconnect();
        //     oscillator.connect(bitcrusherNode).connect(gainNode).connect(audioCtx.destination);
        // }

        console.log('Audio nodes created');
        console.log('Oscillator:', oscillator);
        console.log('Gain node:', gainNode);
        // console.log('Bitcrusher node:', bitcrusherNode);

    }

    async function startAudio() {
        console.log('Starting audio');
        await initializeAudioContext();
        createAudioNodes();

        const now = audioCtx.currentTime;

        // Apply the attack
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now); // Start at 0 volume
        gainNode.gain.linearRampToValueAtTime(1, now + $attack); // Ramp to full volume over the attack time
    
        // Apply the decay to sustain level
        gainNode.gain.linearRampToValueAtTime($sustain, now + $attack + $decay); // Decay to sustain level

        oscillator.start(now);
        isAudioStarted = true;
        console.log('Oscillator started');
    }

    function stopAudio() {
        if (audioCtx && audioCtx.state === 'running') {
            const now = audioCtx.currentTime;

            // Apply the release
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now); // Get current gain value
            gainNode.gain.linearRampToValueAtTime(0, now + $release); // Fade out over the release time

            oscillator.stop(now + $release); // Stop oscillator after release time

            // audioCtx.suspend();
            // console.log('Audio context suspended');
        }
        isAudioStarted = false;
    }

    //     // Reactive statement to restart audio when useBitcrusher changes
    // $: if (audioCtx && isAudioStarted) {
    //     // Reconnect the nodes when bitcrusher toggled
    //     disconnectAudioNodes();
    //     if (useBitcrusher && !bitcrusherNode) {
    //         bitcrusherNode = new AudioWorkletNode(audioCtx, 'bitcrusher-processor', {
    //             parameterData: { bitDepth, sampleRateReduction }
    //         });
    //     }
    //     if (useBitcrusher) {
    //         oscillator.connect(bitcrusherNode).connect(gainNode).connect(audioCtx.destination);
    //     } else {
    //         oscillator.connect(gainNode).connect(audioCtx.destination);
    //     }
    // }



    

    // Reactively update note and octave when frequency changes
    $: {
        const closestNote = getClosestNoteFromFrequency($frequency, noteFrequencyMap);
        if (closestNote) {
            // UI will update when state changes
            note.set(closestNote.slice(0, -1));
            octave.set(parseInt(closestNote.slice(-1)));
        }
    }

      // Reactively update frequency when note and octave change
    $: if (noteFrequencyMap) {
        const newFrequency = noteFrequencyMap[$note + $octave];
        if (newFrequency) {
            frequency.set(newFrequency);
        }
    }

            // Automatically update the oscillator, gain, and bitcrusher when their respective store values change
    $: if (audioCtx && isAudioStarted) {
        if (oscillator) {
            console.log(`Updating oscillator: frequency: ${$frequency}, waveform: ${$waveform}`);
            oscillator.frequency.setValueAtTime($frequency, audioCtx.currentTime);
            oscillator.type = $waveform;
            console.log(`Oscillator updated: frequency: ${oscillator.frequency.value}, waveform: ${oscillator.type}`);
        }

        if (gainNode) {
            console.log(`Updating gain node: gain: ${$gain}`);
            gainNode.gain.setValueAtTime($gain, audioCtx.currentTime);
            console.log(`Gain node updated: gain: ${gainNode.gain.value}`);
        }

        // if (bitcrusherNode) {
        //     bitcrusherNode.port.postMessage({
        //         bitDepth: $bitcrusherSettings.bitDepth,
        //         sampleRateReduction: $bitcrusherSettings.sampleRateReduction
        //     });
        //     console.log(`Bitcrusher node updated: bitDepth: ${$bitcrusherSettings.bitDepth}, sampleRateReduction: ${$bitcrusherSettings.sampleRateReduction}`);
        // }
    }




    onMount(async () => {
        console.log('Component Mounted');
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
            <fieldset id="tone-fieldset">
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
                    <input id="frequency-slider" name="frequency-slider" type="range" min="1" max="6000" step="1" bind:value={$frequency} />
                    <input id="frequency-number" name="frequency-number" type="number" min="1" max="6000" step="1" bind:value={$frequency} />
                    <span>hz</span>
                </div>
    
                <!-- Note selection -->
                <div class="control-group">
                    <label for="note-select">Note:</label>
                    <select id="note-select" name="note-select" bind:value={$note}>
                        {#each notes as { note }}
                            <option value={note}>{note}</option>
                        {/each}
                    </select>
                    <label for="octave-select">Octave:</label>
                    <select id="octave-select" name="octave-select" bind:value={$octave}>
                        {#each Array.from({ length: 10 }, (_, i) => i) as i}
                            <option value={i}>{i}</option>
                        {/each}
                    </select>
                </div>
    
                <!-- Waveform selection -->
                <div class="control-group">
                    <label for="waveform-select">Waveform:</label>
                    <select id="waveform-select" name="waveform-select" bind:value={$waveform}>
                        {#each waveforms as { waveform }}
                            <option value={waveform}>{waveform}</option>
                        {/each}
                    </select>
                </div>

                <!-- Volume/Gain adjust -->
                <div class="control-group">
                    <label for="gain-slider">Volume (Gain): </label>
                    <input id="gain-slider" type="range" min="0" max="1" step="0.01" bind:value={$gain} />
                    <span>{$gain}</span>
                </div>
            </fieldset>

            <!-- Envelope controls -->
            <fieldset>
                <legend>Envelope</legend>
                <div class="control-group">
                    <label for="attack-slider">Attack:</label>
                    <input id="attack-slider" type="range" min="0" max="5" step="0.01" bind:value={$attack} />
                    <span>{$attack} seconds</span>
                </div>

                <div class="control-group">
                    <label for="decay-slider">Decay:</label>
                    <input id="decay-slider" type="range" min="0" max="5" step="0.01" bind:value={$decay} />
                    <span>{$decay} seconds</span>
                </div>

                <div class="control-group">
                    <label for="sustain-slider">Sustain:</label>
                    <input id="sustain-slider" type="range" min="0" max="1" step="0.01" bind:value={$sustain} />
                    <span>{$sustain} (0 to 1)</span>
                </div>

                <div class="control-group">
                    <label for="release-slider">Release:</label>
                    <input id="release-slider" type="range" min="0" max="5" step="0.01" bind:value={$release} />
                    <span>{$release} seconds</span>
                </div>
            </fieldset>
    
    
            <!-- Bitcrusher process controls -->
            <fieldset>
                <legend>Bitcrusher</legend>
                <div class="control-group">
                    <label for="bitcrush-checkbox">Use Bitcrusher:</label>
                    <input id="bitcrush-checkbox" name="bitcrush-toggle" type="checkbox" bind:checked={$useBitcrusher} />
                </div>
    
                <div class="control-group">
                    <label for="bit-depth-slider">Bit depth: </label>
                    <input id="bit-depth-slider" name="bit-depth" type="range" min="1" max="16" step="1" bind:value={$bitcrusherSettings.bitDepth} />
                    <span>{$bitcrusherSettings.bitDepth}</span>
                </div>
    
                <div class="control-group">
                    <label for="sample-rate-reduction-slider">Sample rate reduction:</label>
                    <input id="sampe-rate-reduction-slider" name="sampe-rate-reduction-slider" type="range" min="1" max="16" step="1" bind:value={$bitcrusherSettings.sampleRateReduction} />
                    <span>{$bitcrusherSettings.sampleRateReduction}</span>
                </div>
            </fieldset>
        </div>
        
    
        {:else}
        <div>Your browser does not support the Web Audio API.</div>
    {/if}
</main>

<style>

    .controls-panel {
        display: flex;
        flex-wrap: wrap;
        justify-content: start;
        flex-direction: row;
        gap: 20px;

    }

    #tone-fieldset{
        width: 300px;
    }

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