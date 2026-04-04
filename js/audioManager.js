/**
 * Audio Manager
 * Handles weather sound effects using Web Audio API
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.currentWeather = 'snow';
        this.windOscillator = null;
        this.windGain = null;
        this.rainNoise = null;
        this.rainGain = null;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume context if suspended (browser policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.initialized = true;
            console.log('Audio initialized successfully');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    setWeather(weather) {
        if (!this.initialized) {
            console.log('Audio not initialized yet');
            return;
        }
        
        console.log('Setting weather audio to:', weather);
        this.stopAllSounds();
        this.currentWeather = weather;
        
        switch (weather) {
            case 'sunny':
                this.startRiverSound();
                break;
            case 'snow':
                this.startWindHowlSound();
                break;
            case 'windy':
                this.startWindSound();
                break;
            case 'rain':
                this.startRainSound();
                break;
            case 'thunder':
                this.startThunderSound();
                break;
            case 'foggy':
                this.startSirenSound();
                break;
        }
    }
    
    stopAllSounds() {
        if (this.windNoise) {
            try {
                this.windNoise.stop();
                this.windNoise.disconnect();
            } catch (e) {}
            this.windNoise = null;
        }
        
        if (this.windLfo) {
            try {
                this.windLfo.stop();
                this.windLfo.disconnect();
            } catch (e) {}
            this.windLfo = null;
        }
        
        if (this.windGain) {
            try {
                this.windGain.disconnect();
            } catch (e) {}
            this.windGain = null;
        }
        
        if (this.rainNoise) {
            try {
                this.rainNoise.stop();
                this.rainNoise.disconnect();
            } catch (e) {}
            this.rainNoise = null;
        }
        
        if (this.rainGain) {
            try {
                this.rainGain.disconnect();
            } catch (e) {}
            this.rainGain = null;
        }
        
        if (this.riverNoiseSources) {
            this.riverNoiseSources.forEach(source => {
                try {
                    source.noise.stop();
                    source.noise.disconnect();
                    source.lfo.stop();
                    source.lfo.disconnect();
                } catch (e) {}
            });
            this.riverNoiseSources = null;
        }
        
        if (this.riverGain) {
            try {
                this.riverGain.disconnect();
            } catch (e) {}
            this.riverGain = null;
        }
        
        if (this.cicadaOscillators) {
            this.cicadaOscillators.forEach(osc => {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) {}
            });
            this.cicadaOscillators = null;
        }
        
        if (this.cicadaGain) {
            try {
                this.cicadaGain.disconnect();
            } catch (e) {}
            this.cicadaGain = null;
        }
        
        if (this.windHowlNoise) {
            try {
                this.windHowlNoise.stop();
                this.windHowlNoise.disconnect();
            } catch (e) {}
            this.windHowlNoise = null;
        }
        
        if (this.windHowlGain) {
            try {
                this.windHowlGain.disconnect();
            } catch (e) {}
            this.windHowlGain = null;
        }
        
        if (this.thunderRainNoise) {
            try {
                this.thunderRainNoise.stop();
                this.thunderRainNoise.disconnect();
            } catch (e) {}
            this.thunderRainNoise = null;
        }
        
        if (this.thunderRainGain) {
            try {
                this.thunderRainGain.disconnect();
            } catch (e) {}
            this.thunderRainGain = null;
        }
        
        // Cleanup siren oscillators using array
        if (this.sirenOscillators) {
            this.sirenOscillators.forEach(({ osc, panner, gain }) => {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) {}
                try {
                    panner.disconnect();
                } catch (e) {}
                try {
                    gain.disconnect();
                } catch (e) {}
            });
            this.sirenOscillators = null;
        }
        
        if (this.sirenHighPassFilter) {
            try {
                this.sirenHighPassFilter.disconnect();
            } catch (e) {}
            this.sirenHighPassFilter = null;
        }
        
        if (this.sirenRectifier) {
            try {
                this.sirenRectifier.disconnect();
            } catch (e) {}
            this.sirenRectifier = null;
        }
        
        if (this.sirenLfoAmplitudeGain) {
            try {
                this.sirenLfoAmplitudeGain.disconnect();
            } catch (e) {}
            this.sirenLfoAmplitudeGain = null;
        }
        
        if (this.sirenLFO) {
            try {
                this.sirenLFO.stop();
                this.sirenLFO.disconnect();
            } catch (e) {}
            this.sirenLFO = null;
        }
        
        if (this.sirenGain) {
            try {
                this.sirenGain.disconnect();
            } catch (e) {}
            this.sirenGain = null;
        }
        
        if (this.sirenDelay) {
            try {
                this.sirenDelay.disconnect();
            } catch (e) {}
            this.sirenDelay = null;
        }
        
        if (this.sirenFeedback) {
            try {
                this.sirenFeedback.disconnect();
            } catch (e) {}
            this.sirenFeedback = null;
        }
        
        if (this.sirenEchoGain) {
            try {
                this.sirenEchoGain.disconnect();
            } catch (e) {}
            this.sirenEchoGain = null;
        }
    }
    
    startWindSound() {
        if (!this.audioContext) return;
        
        console.log('Starting wind sound');
        
        // Create wind sound using filtered noise
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        this.windNoise = this.audioContext.createBufferSource();
        this.windNoise.buffer = buffer;
        this.windNoise.loop = true;
        
        // Apply filters for wind effect
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;
        
        this.windGain = this.audioContext.createGain();
        this.windGain.gain.value = 0.3; // Increased volume
        
        // Create subtle modulation
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 0.2;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 50;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        // Connect audio graph
        this.windNoise.connect(filter);
        filter.connect(this.windGain);
        this.windGain.connect(this.audioContext.destination);
        
        // Start sounds
        this.windNoise.start();
        lfo.start();
        
        // Store references to stop later
        this.windLfo = lfo;
        
        console.log('Wind sound started successfully');
    }
    
    startRainSound() {
        if (!this.audioContext) return;
        
        console.log('Starting rain sound');
        
        // Create rain sound using high-frequency noise
        const bufferSize = this.audioContext.sampleRate * 1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.05;
        }
        
        this.rainNoise = this.audioContext.createBufferSource();
        this.rainNoise.buffer = buffer;
        this.rainNoise.loop = true;
        
        // Apply high-pass filter for rain effect
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        
        this.rainGain = this.audioContext.createGain();
        this.rainGain.gain.value = 0.15; // Increased volume
        
        // Connect audio graph
        this.rainNoise.connect(filter);
        filter.connect(this.rainGain);
        this.rainGain.connect(this.audioContext.destination);
        
        // Start sound
        this.rainNoise.start();
        
        console.log('Rain sound started successfully');
    }
    
    startRiverSound() {
        if (!this.audioContext) return;
        
        console.log('Starting river sound');
        
        // Create multiple noise sources for realistic water flow
        this.riverNoiseSources = [];
        this.riverGain = this.audioContext.createGain();
        this.riverGain.gain.value = 0.15;
        
        // Create 3 different water noise layers
        for (let i = 0; i < 3; i++) {
            const bufferSize = this.audioContext.sampleRate * 4;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate different characteristics for each layer
            for (let j = 0; j < bufferSize; j++) {
                const amplitude = i === 0 ? 0.03 : i === 1 ? 0.02 : 0.01;
                data[j] = (Math.random() * 2 - 1) * amplitude;
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;
            
            // Create different filters for each layer
            const filter = this.audioContext.createBiquadFilter();
            if (i === 0) {
                // Low frequency rumble - deep water
                filter.type = 'lowpass';
                filter.frequency.value = 200;
                filter.Q.value = 0.5;
            } else if (i === 1) {
                // Mid frequency flow - medium water
                filter.type = 'bandpass';
                filter.frequency.value = 800;
                filter.Q.value = 2;
            } else {
                // High frequency babble - small rapids
                filter.type = 'highpass';
                filter.frequency.value = 2000;
                filter.Q.value = 1;
            }
            
            // Add subtle modulation for natural variation
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.value = 0.1 + i * 0.05;
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = i === 0 ? 50 : i === 1 ? 100 : 200;
            
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            
            // Connect audio graph
            noiseSource.connect(filter);
            filter.connect(this.riverGain);
            
            // Start the noise and LFO
            noiseSource.start();
            lfo.start();
            
            this.riverNoiseSources.push({
                noise: noiseSource,
                lfo: lfo
            });
        }
        
        this.riverGain.connect(this.audioContext.destination);
        
        console.log('River sound started successfully');
    }
    
    startWindHowlSound() {
        if (!this.audioContext) return;
        
        console.log('Starting wind howl sound');
        
        // Create wind howl using filtered noise with modulation
        const bufferSize = this.audioContext.sampleRate * 3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.08;
        }
        
        this.windHowlNoise = this.audioContext.createBufferSource();
        this.windHowlNoise.buffer = buffer;
        this.windHowlNoise.loop = true;
        
        // Create complex filtering for howl effect
        const filter1 = this.audioContext.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.value = 800;
        filter1.Q.value = 2;
        
        const filter2 = this.audioContext.createBiquadFilter();
        filter2.type = 'bandpass';
        filter2.frequency.value = 400;
        filter2.Q.value = 5;
        
        this.windHowlGain = this.audioContext.createGain();
        this.windHowlGain.gain.value = 0.2;
        
        // Create slow modulation for howl effect
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 0.3;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 300;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter1.frequency);
        
        // Connect audio graph
        this.windHowlNoise.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(this.windHowlGain);
        this.windHowlGain.connect(this.audioContext.destination);
        
        // Start sounds
        this.windHowlNoise.start();
        lfo.start();
        
        console.log('Wind howl sound started successfully');
    }
    
    startThunderSound() {
        if (!this.audioContext) return;
        
        console.log('Starting thunder sound');
        
        // Create continuous rain sound for thunderstorm
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.06;
        }
        
        this.thunderRainNoise = this.audioContext.createBufferSource();
        this.thunderRainNoise.buffer = buffer;
        this.thunderRainNoise.loop = true;
        
        const rainFilter = this.audioContext.createBiquadFilter();
        rainFilter.type = 'highpass';
        rainFilter.frequency.value = 3000;
        rainFilter.Q.value = 1;
        
        this.thunderRainGain = this.audioContext.createGain();
        this.thunderRainGain.gain.value = 0.08;
        
        // Connect rain sound
        this.thunderRainNoise.connect(rainFilter);
        rainFilter.connect(this.thunderRainGain);
        this.thunderRainGain.connect(this.audioContext.destination);
        
        // Start rain sound
        this.thunderRainNoise.start();
        
        // Store thunder generation method
        this.generateThunder = () => {
            const thunderDuration = 2 + Math.random() * 3; // Longer duration
            const thunderBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * thunderDuration, this.audioContext.sampleRate);
            const thunderData = thunderBuffer.getChannelData(0);
            
            // Generate thunder as filtered noise (realistic approach)
            for (let i = 0; i < thunderData.length; i++) {
                const t = i / this.audioContext.sampleRate;
                
                // Generate base noise
                let noise = (Math.random() * 2 - 1);
                
                // Apply time-varying lowpass filter effect in time domain
                const cutoffFreq = 2000 * Math.exp(-t * 3) + 50; // Sweep from high to low
                const filterStrength = Math.exp(-t * 2); // Reduce filtering over time
                
                // Simple lowpass filter approximation
                if (i > 0) {
                    const alpha = Math.exp(-2 * Math.PI * cutoffFreq / this.audioContext.sampleRate);
                    thunderData[i] = thunderData[i - 1] * alpha + noise * (1 - alpha) * filterStrength;
                } else {
                    thunderData[i] = noise * filterStrength;
                }
                
                // Complex envelope for realistic thunder
                const attack = 0.05;
                const decay = 0.4;
                const sustain = 0.8;
                const release = thunderDuration - attack - decay - sustain;
                
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
            
            const thunderSource = this.audioContext.createBufferSource();
            thunderSource.buffer = thunderBuffer;
            
            // Create reverb effect using convolution (simplified)
            const convolver = this.audioContext.createConvolver();
            const reverbDuration = 4; // Longer reverb
            const reverbBuffer = this.audioContext.createBuffer(2, this.audioContext.sampleRate * reverbDuration, this.audioContext.sampleRate);
            
            // Generate more realistic reverb impulse response
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    const t = i / this.audioContext.sampleRate;
                    // Exponential decay with some early reflections
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 0.8) * 0.6;
                    
                    // Add early reflections
                    if (i > this.audioContext.sampleRate * 0.03 && i < this.audioContext.sampleRate * 0.05) {
                        channelData[i] += (Math.random() * 2 - 1) * 0.3;
                    }
                    if (i > this.audioContext.sampleRate * 0.08 && i < this.audioContext.sampleRate * 0.1) {
                        channelData[i] += (Math.random() * 2 - 1) * 0.2;
                    }
                }
            }
            
            convolver.buffer = reverbBuffer;
            
            // Apply additional filtering for thunder character
            const thunderFilter = this.audioContext.createBiquadFilter();
            thunderFilter.type = 'lowpass';
            thunderFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
            thunderFilter.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + thunderDuration);
            thunderFilter.Q.value = 1.5;
            
            // Add body filter for low-end weight
            const bodyFilter = this.audioContext.createBiquadFilter();
            bodyFilter.type = 'bandpass';
            bodyFilter.frequency.value = 60;
            bodyFilter.Q.value = 0.8;
            
            const thunderGain = this.audioContext.createGain();
            thunderGain.gain.value = 0.6;
            
            // Create wet/dry mix with wetter reverb
            const dryGain = this.audioContext.createGain();
            dryGain.gain.value = 0.3; // Less dry signal
            const wetGain = this.audioContext.createGain();
            wetGain.gain.value = 0.7; // More wet signal (reverb)
            
            // Connect audio graph
            thunderSource.connect(thunderFilter);
            thunderFilter.connect(bodyFilter);
            bodyFilter.connect(dryGain);
            bodyFilter.connect(convolver);
            convolver.connect(wetGain);
            
            dryGain.connect(thunderGain);
            wetGain.connect(thunderGain);
            thunderGain.connect(this.audioContext.destination);
            
            thunderSource.start();
            thunderSource.stop(this.audioContext.currentTime + thunderDuration);
        };
        
        console.log('Thunder sound started successfully');
    }
    
    startSirenSound() {
        if (!this.audioContext) return;
        
        console.log('Starting siren sound');
        
        this.sirenGain = this.audioContext.createGain();
        
        // Siren configuration object with all magic numbers
        const sirenConfig = {
            oscillators: [
                { gain: 0.25, pan: -0.8 },  // Far left
                { gain: 0.20, pan: -0.3 },  // Left-center
                { gain: 0.15, pan: 0.3 },   // Right-center
                { gain: 0.10, pan: 0.8 }    // Far right
            ],
            frequency: {
                min: 100,        // Minimum frequency (Hz)
                max: 400,        // Maximum frequency (Hz)
                sweepRate: 0.05  // LFO frequency (Hz) - 20 second cycle
            },
            gain: {
                main: 0.04,      // Main gain volume
                dry: 0.5,       // Dry signal mix
                wet: 0.5,       // Wet signal mix
                feedback: 0.4    // Echo feedback amount
            },
            delay: {
                time: 1.5,       // Delay time in seconds
                maxDelay: 2.0    // Maximum delay for createDelay
            },
            filters: {
                lowpass: {
                    dryFreq: 1200,  // Dry signal lowpass frequency
                    dryQ: 1.5,      // Dry signal Q factor
                    echoFreq: 800,  // Echo lowpass frequency
                    echoQ: 2        // Echo Q factor
                },
                highpass: {
                    freq: 200,      // Highpass frequency
                    q: 1           // Highpass Q factor
                }
            }
        };
        
        // Generate siren oscillators from configuration
        this.sirenOscillators = sirenConfig.oscillators.map(config => {
            const osc = this.audioContext.createOscillator();
            const panner = this.audioContext.createStereoPanner();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sawtooth';
            panner.pan.value = config.pan;
            gain.gain.value = config.gain;
            
            osc.connect(gain);
            gain.connect(panner);
            panner.connect(this.sirenGain);
            
            return { osc, panner, gain };
        });
        
        // Start all oscillators
        this.sirenOscillators.forEach(({ osc }) => osc.start());
        
        // Create LFO for siren effect - use sine with manual phase offset
        this.sirenLFO = this.audioContext.createOscillator();
        this.sirenLFO.frequency.value = sirenConfig.frequency.sweepRate;
        this.sirenLFO.type = 'sine';
        
        // Create gain for LFO to control frequency modulation
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = (sirenConfig.frequency.max - sirenConfig.frequency.min) / 2; // Half range
        
        // Create constant offset for center frequency
        const offsetGain = this.audioContext.createGain();
        offsetGain.gain.value = (sirenConfig.frequency.min + sirenConfig.frequency.max) / 2; // Center frequency
        
        // Create inverter to flip sine to start from bottom
        const inverterGain = this.audioContext.createGain();
        inverterGain.gain.value = -1;
        
        // Create DC offset to shift inverted sine to start at bottom
        const dcOffsetGain = this.audioContext.createGain();
        dcOffsetGain.gain.value = -(sirenConfig.frequency.max - sirenConfig.frequency.min) / 2; // Subtract half range to start at bottom
        
        // Connect LFO through inverter and DC offset
        this.sirenLFO.connect(inverterGain);
        inverterGain.connect(lfoGain);
        dcOffsetGain.connect(lfoGain);
        
        // Start the LFO
        this.sirenLFO.start();
        
        // Connect modulation and offset to all oscillators
        this.sirenOscillators.forEach(({ osc }) => {
            lfoGain.connect(osc.frequency);
            offsetGain.connect(osc.frequency);
        });
        
        // Create main gain control
        this.sirenGain.gain.value = sirenConfig.gain.main;
        
        // Create echo/delay effect
        this.sirenDelay = this.audioContext.createDelay(sirenConfig.delay.maxDelay);
        this.sirenDelay.delayTime.value = sirenConfig.delay.time;
        
        this.sirenFeedback = this.audioContext.createGain();
        this.sirenFeedback.gain.value = sirenConfig.gain.feedback;
        
        this.sirenEchoGain = this.audioContext.createGain();
        this.sirenEchoGain.gain.value = sirenConfig.gain.wet;
        
        this.sirenDryGain = this.audioContext.createGain();
        this.sirenDryGain.gain.value = sirenConfig.gain.dry;
        
        // Connect audio graph for 50/50 wet/dry mix
        this.sirenGain.connect(this.sirenDryGain);
        this.sirenDryGain.connect(this.audioContext.destination); // Direct sound (50%)
        
        // Echo path (50%)
        this.sirenGain.connect(this.sirenDelay);
        this.sirenDelay.connect(this.sirenFeedback);
        this.sirenFeedback.connect(this.sirenDelay); // Feedback loop
        this.sirenDelay.connect(this.sirenEchoGain);
        this.sirenEchoGain.connect(this.audioContext.destination);
        
        // Add filter to make it sound more distant
        const sirenFilter = this.audioContext.createBiquadFilter();
        const echoFilter = this.audioContext.createBiquadFilter();
        const highPassFilter = this.audioContext.createBiquadFilter(); // HPF for distant sound
        this.sirenHighPassFilter = highPassFilter; // Store reference for cleanup
        
        sirenFilter.type = 'lowpass';
        sirenFilter.frequency.value = sirenConfig.filters.lowpass.dryFreq;
        sirenFilter.Q.value = sirenConfig.filters.lowpass.dryQ;
        
        echoFilter.type = 'lowpass';
        echoFilter.frequency.value = sirenConfig.filters.lowpass.echoFreq;
        echoFilter.Q.value = sirenConfig.filters.lowpass.echoQ;
        
        // High-pass filter to simulate poor low-frequency hearing at distance
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = sirenConfig.filters.highpass.freq;
        highPassFilter.Q.value = sirenConfig.filters.highpass.q;
        
        // Insert filters in both paths
        this.sirenDryGain.disconnect();
        this.sirenDryGain.connect(sirenFilter);
        sirenFilter.connect(highPassFilter); // Add HPF after LPF
        highPassFilter.connect(this.audioContext.destination);
        
        this.sirenEchoGain.disconnect();
        this.sirenEchoGain.connect(echoFilter);
        echoFilter.connect(highPassFilter); // Add HPF to echo path too
        highPassFilter.connect(this.audioContext.destination);
        
        console.log('Siren sound started successfully');
    }
}
