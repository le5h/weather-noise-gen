// Thunder Worker - Generate thunder sound in background thread
self.onmessage = function(e) {
    if (e.data.type === 'generateThunder') {
        const { sampleRate, duration } = e.data;
        
        // Generate thunder audio data
        const thunderBuffer = new Float32Array(sampleRate * duration);
        const thunderData = thunderBuffer;
        
        for (let i = 0; i < thunderData.length; i++) {
            const t = i / sampleRate;
            
            // Generate base noise
            let noise = (Math.random() * 2 - 1);
            
            // Apply time-varying lowpass filter effect in time domain
            const cutoffFreq = 2000 * Math.exp(-t * 3) + 50; // Sweep from high to low
            const filterStrength = Math.exp(-t * 2); // Reduce filtering over time
            
            // Simple lowpass filter approximation
            if (i > 0) {
                const alpha = Math.exp(-2 * Math.PI * cutoffFreq / sampleRate);
                thunderData[i] = thunderData[i - 1] * alpha + noise * (1 - alpha) * filterStrength;
            } else {
                thunderData[i] = noise * filterStrength;
            }
            
            // Complex envelope for realistic thunder
            const attack = 0.05;
            const decay = 0.4;
            const sustain = 0.8;
            const release = duration - attack - decay - sustain;
            
            let envelope;
            if (t < attack) {
                envelope = t / attack;
            } else if (t < attack + decay) {
                envelope = 1 - ((t - attack) / decay) * 0.4;
            } else if (t < attack + decay + sustain) {
                envelope = 0.6 - ((t - attack - decay) / sustain) * 0.3;
            } else {
                envelope = 0.3 * Math.exp(-((t - attack - decay - sustain) / release) * 2);
            }
            
            // Apply envelope
            thunderData[i] *= envelope * 0.8;
            
            // Add some low-frequency rumble
            const rumble = Math.sin(2 * Math.PI * 40 * t) * 0.1 * Math.exp(-t);
            thunderData[i] += rumble * envelope;
        }
        
        // Generate reverb buffer in worker to prevent blocking
        const reverbDuration = 4;
        const reverbBuffer = new Float32Array(2 * sampleRate * reverbDuration);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelOffset = channel * sampleRate * reverbDuration;
            for (let i = 0; i < sampleRate * reverbDuration; i++) {
                const t = i / sampleRate;
                // Exponential decay with some early reflections
                reverbBuffer[channelOffset + i] = (Math.random() * 2 - 1) * Math.exp(-t * 0.8) * 0.6;
                
                // Add early reflections
                if (i > sampleRate * 0.03 && i < sampleRate * 0.05) {
                    reverbBuffer[channelOffset + i] += (Math.random() * 2 - 1) * 0.3;
                }
                if (i > sampleRate * 0.08 && i < sampleRate * 0.1) {
                    reverbBuffer[channelOffset + i] += (Math.random() * 2 - 1) * 0.2;
                }
            }
        }
        
        // Send the generated audio data back to main thread
        self.postMessage({
            type: 'thunderGenerated',
            audioData: thunderBuffer,
            reverbData: reverbBuffer,
            position: e.data.position
        });
    }
};
