
export function generateNoteFrequencies() {
    const A4 = 440;  // Reference frequency of A4
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let noteFrequencyMap = {};

    // Iterate through octaves 0 to 9
    for (let octave = 0; octave <= 9; octave++) {
        for (let i = 0; i < noteNames.length; i++) {
            // Calculate the number of semitones from A4
            const semitonesFromA4 = i - 9 + (octave - 4) * 12; // Semitone difference from A4
            let frequency = A4 * Math.pow(2, semitonesFromA4 / 12);
            // Round the frequency to 2 decimal places
            frequency = parseFloat(frequency.toFixed(2));
                        
            // Create the note name with octave, e.g., "C4", "A5"
            const noteName = noteNames[i] + octave;
            
            // Store in the map
            noteFrequencyMap[noteName] = frequency;
        }
    }

    return noteFrequencyMap;
}

export function getClosestNoteFromFrequency(frequency, noteFrequencyMap) {
    let closestNote = '';
    let minDifference = Infinity;

    for (const note in noteFrequencyMap) {
        const diff = Math.abs(noteFrequencyMap[note] - frequency);
        if (diff < minDifference) {
            minDifference = diff;
            closestNote = note;
        }
    }

    return closestNote;
}