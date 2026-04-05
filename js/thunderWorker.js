// Thunder Worker - Generate thunder sound in background thread

function calculateThunderEnvelope(t, duration) {
    const attack = 0.05;
    const decay = 0.4;
    const sustain = 0.8;
    const release = duration - attack - decay - sustain;
    
    if (t < attack) {
        return t / attack;
    } else if (t < attack + decay) {
        return 1 - ((t - attack) / decay) * 0.4;
    } else if (t < attack + decay + sustain) {
        return 0.6 - ((t - attack - decay) / sustain) * 0.3;
    } else {
        return 0.3 * Math.exp(-((t - attack - decay - sustain) / release) * 2);
    }
}

function generateReverbBuffer(sampleRate, duration, earlyReflections) {
    const buffer = new Float32Array(2 * sampleRate * duration);
    
    for (let channel = 0; channel < 2; channel++) {
        const channelOffset = channel * sampleRate * duration;
        for (let i = 0; i < sampleRate * duration; i++) {
            const t = i / sampleRate;
            buffer[channelOffset + i] = (Math.random() * 2 - 1) * Math.exp(-t * 0.8) * 0.6;
            
            // Add early reflections
            earlyReflections.forEach(reflection => {
                if (i > sampleRate * reflection.start && i < sampleRate * reflection.end) {
                    buffer[channelOffset + i] += (Math.random() * 2 - 1) * reflection.amplitude;
                }
            });
        }
    }
    return buffer;
}

self.onmessage = function(e) {
    if (e.data.type === 'generateThunder') {
        const { sampleRate, duration } = e.data;
        
        // Generate thunder audio data
        const thunderBuffer = new Float32Array(sampleRate * duration);
        
        for (let i = 0; i < thunderBuffer.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1);
            
            // Apply time-varying lowpass filter effect in time domain
            const cutoffFreq = 2000 * Math.exp(-t * 3) + 50;
            const filterStrength = Math.exp(-t * 2);
            const alpha = Math.exp(-2 * Math.PI * cutoffFreq / sampleRate);
            
            const filteredNoise = i > 0 
                ? thunderBuffer[i - 1] * alpha + noise * (1 - alpha) * filterStrength
                : noise * filterStrength;
            
            const envelope = calculateThunderEnvelope(t, duration);
            thunderBuffer[i] = filteredNoise * envelope * 0.8;
            
            // Add low-frequency rumble
            const rumble = Math.sin(2 * Math.PI * 40 * t) * 0.1 * Math.exp(-t);
            thunderBuffer[i] += rumble * envelope;
        }
        
        // Generate reverb buffer in worker to prevent blocking
        const reverbBuffer = generateReverbBuffer(sampleRate, 4, [
            { start: 0.03, end: 0.05, amplitude: 0.3 },
            { start: 0.08, end: 0.1, amplitude: 0.2 }
        ]);
        
        // Send the generated audio data back to main thread
        self.postMessage({
            type: 'thunderGenerated',
            audioData: thunderBuffer,
            reverbData: reverbBuffer,
            position: e.data.position
        });
    }
};
