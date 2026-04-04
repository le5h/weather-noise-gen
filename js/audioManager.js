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
        this.thunderWorker = null;
        this.pendingThunder = null;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume context if suspended (browser policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Initialize thunder worker
            this.initThunderWorker();
            
            this.initialized = true;
            console.log('Audio initialized successfully');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    initThunderWorker() {
        try {
            this.thunderWorker = new Worker('./js/thunderWorker.js');
            
            this.thunderWorker.onmessage = (e) => {
                if (e.data.type === 'thunderGenerated') {
                    this.playThunderSound(e.data.audioData, e.data.reverbData, e.data.position);
                }
            };
            
            console.log('Thunder worker initialized successfully');
        } catch (error) {
            console.warn('Thunder worker not supported, falling back to main thread:', error);
            this.thunderWorker = null;
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
                this.startSunHumSound();
                break;
            case 'snow':
                this.startWindHowlSound();
                break;
            case 'windy':
                this.startWindSound();
                this.startTreeNoiseSound();
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
            case 'ocean':
                this.startOceanSound();
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
        
        // Cleanup sun oscillators and components
        if (this.sunOscillators) {
            this.sunOscillators.forEach(({ osc, gain }) => {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) {}
                try {
                    gain.disconnect();
                } catch (e) {}
            });
            this.sunOscillators = null;
        }
        
        if (this.sunLfo) {
            try {
                this.sunLfo.stop();
                this.sunLfo.disconnect();
            } catch (e) {}
            this.sunLfo = null;
        }
        
        if (this.sunFilter) {
            try {
                this.sunFilter.disconnect();
            } catch (e) {}
            this.sunFilter = null;
        }
        
        if (this.sunGain) {
            try {
                this.sunGain.disconnect();
            } catch (e) {}
            this.sunGain = null;
        }
        
        // Cleanup tree noise sources
        if (this.treeNoiseSources) {
            this.treeNoiseSources.forEach(({ noiseSource, filter, layerGain, burstLfo }) => {
                try {
                    noiseSource.stop();
                    noiseSource.disconnect();
                } catch (e) {}
                try {
                    filter.disconnect();
                } catch (e) {}
                try {
                    layerGain.disconnect();
                } catch (e) {}
                try {
                    burstLfo.stop();
                    burstLfo.disconnect();
                } catch (e) {}
            });
            this.treeNoiseSources = null;
        }
        
        if (this.treeGain) {
            try {
                this.treeGain.disconnect();
            } catch (e) {}
            this.treeGain = null;
        }
        
        // Cleanup ocean noise sources
        if (this.oceanNoiseSources) {
            this.oceanNoiseSources.forEach(({ noiseSource, filter, gain, lfo }) => {
                try {
                    noiseSource.stop();
                    noiseSource.disconnect();
                } catch (e) {}
                try {
                    filter.disconnect();
                } catch (e) {}
                try {
                    gain.disconnect();
                } catch (e) {}
                try {
                    lfo.stop();
                    lfo.disconnect();
                } catch (e) {}
            });
            this.oceanNoiseSources = null;
        }
        
        if (this.oceanGain) {
            try {
                this.oceanGain.disconnect();
            } catch (e) {}
            this.oceanGain = null;
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
        
        // Create rain sound using bandpass-filtered noise (copied from thunder)
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.06;
        }
        
        this.rainNoise = this.audioContext.createBufferSource();
        this.rainNoise.buffer = buffer;
        this.rainNoise.loop = true;
        
        // Apply bandpass filter for natural outdoor rain effect
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 0.8;
        
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
        
        console.log('Starting grass+wind sound');
        
        // Create grass+wind sound with volume bursts
        this.riverNoiseSources = [];
        this.riverGain = this.audioContext.createGain();
        this.riverGain.gain.value = 0.2;
        
        // Create 3 different wind/grass layers
        for (let i = 0; i < 3; i++) {
            const bufferSize = this.audioContext.sampleRate * 4;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate different characteristics for each layer
            for (let j = 0; j < bufferSize; j++) {
                const amplitude = i === 0 ? 0.04 : i === 1 ? 0.03 : 0.02;
                data[j] = (Math.random() * 2 - 1) * amplitude;
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;
            
            // Create filters for grass+wind effect (V-shaped EQ with reduced highs)
            const filter = this.audioContext.createBiquadFilter();
            if (i === 0) {
                // Low frequency wind rumble
                filter.type = 'lowpass';
                filter.frequency.value = 200;
                filter.Q.value = 0.6;
            } else if (i === 1) {
                // Mid frequency grass rustle (boosted for V-shape)
                filter.type = 'bandpass';
                filter.frequency.value = 1500;
                filter.Q.value = 2.5;
            } else {
                // High frequency wind hiss (reduced for V-shape)
                filter.type = 'highpass';
                filter.frequency.value = 2500;
                filter.Q.value = 0.3;
            }
            
            // Create volume burst modulation (like wind gusts)
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.value = 0.1 + i * 0.08; // Different rates for each layer
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = i === 0 ? 0.6 : i === 1 ? 0.8 : 1.0; // Stronger modulation for higher frequencies
            
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            
            // Create additional amplitude modulation for wind bursts with volume limiting
            const burstLfo = this.audioContext.createOscillator();
            burstLfo.frequency.value = 0.05 + i * 0.03;
            const burstGain = this.audioContext.createGain();
            burstGain.gain.value = 0.175; // Modulation range: ±17.5% around 25% base (10-50%)
            
            // Create volume limiter to prevent complete silence and cap at 50%
            const limiterGain = this.audioContext.createGain();
            limiterGain.gain.value = 0.25; // Base volume 25%
            
            burstLfo.connect(burstGain);
            burstGain.connect(limiterGain.gain); // Modulate the limiter gain
            
            // Connect audio graph with amplitude modulation through limiter
            noiseSource.connect(filter);
            filter.connect(limiterGain);
            limiterGain.connect(this.riverGain);
            
            // Start the noise and LFOs
            noiseSource.start();
            lfo.start();
            burstLfo.start();
            
            this.riverNoiseSources.push({
                noise: noiseSource,
                lfo: lfo,
                burstLfo: burstLfo
            });
        }
        
        this.riverGain.connect(this.audioContext.destination);
        
        console.log('Grass+wind sound started successfully');
    }
    
    startTreeNoiseSound() {
        if (!this.audioContext) return;
        
        console.log('Starting tree noise sound');
        
        // Create tree noise sound with volume bursts
        this.treeNoiseSources = [];
        this.treeGain = this.audioContext.createGain();
        this.treeGain.gain.value = 0.15; // Slightly quieter than grass
        
        // Create 3 different tree layers (rustling leaves, branches, creaks)
        for (let i = 0; i < 3; i++) {
            const bufferSize = this.audioContext.sampleRate * 3;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate different characteristics for each layer
            for (let j = 0; j < bufferSize; j++) {
                const amplitude = i === 0 ? 0.03 : i === 1 ? 0.025 : 0.02;
                data[j] = (Math.random() * 2 - 1) * amplitude;
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;
            
            // Create filters for tree effect (more mid-range than grass)
            const filter = this.audioContext.createBiquadFilter();
            if (i === 0) {
                // Low frequency tree creaks
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                filter.Q.value = 0.8;
            } else if (i === 1) {
                // Mid frequency leaf rustle
                filter.type = 'bandpass';
                filter.frequency.value = 1200;
                filter.Q.value = 2.0;
            } else {
                // Higher frequency twig snaps
                filter.type = 'highpass';
                filter.frequency.value = 2000;
                filter.Q.value = 1.2;
            }
            
            // Create LFO for volume bursts (wind gusts through trees)
            const burstLfo = this.audioContext.createOscillator();
            const burstLfoGain = this.audioContext.createGain();
            
            burstLfo.frequency.value = 0.2 + i * 0.1; // Different rates for each layer
            burstLfo.type = 'sine';
            burstLfoGain.gain.value = 0.3;
            
            // Create gain for this layer
            const layerGain = this.audioContext.createGain();
            layerGain.gain.value = 0.4;
            
            // Connect LFO to layer gain for volume modulation
            burstLfo.connect(burstLfoGain);
            burstLfoGain.connect(layerGain.gain);
            
            // Connect audio graph
            noiseSource.connect(filter);
            filter.connect(layerGain);
            layerGain.connect(this.treeGain);
            
            // Start sources
            noiseSource.start();
            burstLfo.start();
            
            // Store references to stop later
            this.treeNoiseSources.push({
                noiseSource: noiseSource,
                filter: filter,
                layerGain: layerGain,
                burstLfo: burstLfo
            });
        }
        
        this.treeGain.connect(this.audioContext.destination);
        
        console.log('Tree noise sound started successfully');
    }
    
    startOceanSound() {
        if (!this.audioContext) return;
        
        console.log('Starting ocean sound');
        
        // Create ocean sound with multiple layers for realistic seashore effect
        this.oceanNoiseSources = [];
        this.oceanGain = this.audioContext.createGain();
        this.oceanGain.gain.value = 0.25;
        
        // Create 3 different ocean layers for realistic waves
        for (let i = 0; i < 3; i++) {
            const bufferSize = this.audioContext.sampleRate * 5; // Longer buffer for variety
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate different characteristics for each layer
            for (let j = 0; j < bufferSize; j++) {
                const amplitude = i === 0 ? 0.06 : i === 1 ? 0.04 : 0.03;
                data[j] = (Math.random() * 2 - 1) * amplitude;
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;
            
            // Create filters for ocean wave effect
            const filter = this.audioContext.createBiquadFilter();
            if (i === 0) {
                // Low frequency ocean rumble (deep waves)
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                filter.Q.value = 0.8;
            } else if (i === 1) {
                // Mid frequency wave crash
                filter.type = 'bandpass';
                filter.frequency.value = 800;
                filter.Q.value = 1.5;
            } else {
                // High frequency foam and hiss
                filter.type = 'highpass';
                filter.frequency.value = 2000;
                filter.Q.value = 0.5;
            }
            
            // Create LFO for wave rhythm with random pace
            const lfo = this.audioContext.createOscillator();
            lfo.frequency.value = 0.1 + Math.random() * 0.15; // Random pace between 0.1-0.25 Hz
            lfo.type = 'sine';
            
            const lfoGain = this.audioContext.createGain();
            
            // Create envelope for wave fade in/out (log fade)
            const waveEnvelope = this.audioContext.createGain();
            waveEnvelope.gain.value = 0.3; // Base volume
            
            // Connect LFO to create rising/falling wave effect
            lfo.connect(lfoGain);
            lfoGain.gain.value = 0.4; // Modulation depth
            
            // Apply logarithmic-like envelope by modulating the gain
            lfoGain.connect(waveEnvelope.gain);
            
            // Create gain for this layer
            const layerGain = this.audioContext.createGain();
            layerGain.gain.value = i === 0 ? 0.5 : i === 1 ? 0.7 : 0.4;
            
            // Connect audio graph
            noiseSource.connect(filter);
            filter.connect(waveEnvelope);
            waveEnvelope.connect(layerGain);
            layerGain.connect(this.oceanGain);
            
            // Start the noise and LFO
            noiseSource.start();
            lfo.start();
            
            // Store references to stop later
            this.oceanNoiseSources.push({
                noiseSource: noiseSource,
                filter: filter,
                gain: layerGain,
                lfo: lfo
            });
        }
        
        this.oceanGain.connect(this.audioContext.destination);
        
        console.log('Ocean sound started successfully');
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
        
        // Create thicker rain sound for thunderstorm using multiple layers
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.08;
        }
        
        this.thunderRainNoise = this.audioContext.createBufferSource();
        this.thunderRainNoise.buffer = buffer;
        this.thunderRainNoise.loop = true;
        
        // Create dual-filter system for thicker sound
        const lowFilter = this.audioContext.createBiquadFilter();
        lowFilter.type = 'lowpass';
        lowFilter.frequency.value = 1200;
        lowFilter.Q.value = 1.5;
        
        const midFilter = this.audioContext.createBiquadFilter();
        midFilter.type = 'bandpass';
        midFilter.frequency.value = 800;
        midFilter.Q.value = 2;
        
        this.thunderRainGain = this.audioContext.createGain();
        this.thunderRainGain.gain.value = 0.12;
        
        // Connect rain sound through both filters for thicker texture
        this.thunderRainNoise.connect(lowFilter);
        this.thunderRainNoise.connect(midFilter);
        lowFilter.connect(this.thunderRainGain);
        midFilter.connect(this.thunderRainGain);
        this.thunderRainGain.connect(this.audioContext.destination);
        
        // Start rain sound
        this.thunderRainNoise.start();
        
        // Store thunder generation method
        this.generateThunder = (positionData = null) => {
            const thunderDuration = 2 + Math.random() * 3; // Longer duration
            
            if (this.thunderWorker) {
                // Use worker for non-blocking generation
                this.thunderWorker.postMessage({
                    type: 'generateThunder',
                    sampleRate: this.audioContext.sampleRate,
                    duration: thunderDuration,
                    position: positionData
                });
            } else {
                // Fallback to main thread generation
                this.generateThunderMainThread(thunderDuration, positionData);
            }
        };
        
        console.log('Thunder sound started successfully');
    }
    
    generateThunderMainThread(duration) {
        // Fallback method for when worker is not available
        const thunderBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
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
        
        this.playThunderSound(thunderData);
    }
    
    playThunderSound(audioData, reverbData = null, positionData = null) {
        // Create audio buffer from worker data
        const duration = audioData.length / this.audioContext.sampleRate;
        const thunderBuffer = this.audioContext.createBuffer(1, audioData.length, this.audioContext.sampleRate);
        thunderBuffer.copyToChannel(audioData, 0);
        
        const thunderSource = this.audioContext.createBufferSource();
        thunderSource.buffer = thunderBuffer;
        
        // Apply spatial audio based on lightning position
        const panNode = this.audioContext.createStereoPanner();
        const distanceGain = this.audioContext.createGain();
        
        if (positionData) {
            // Apply panning based on lightning position
            panNode.pan.value = positionData.pan; // -1 (left) to 1 (right)
            
            // Apply distance-based volume (closer = louder)
            const distanceVolume = 1 - (positionData.distance * 0.5); // Reduce volume by up to 50% at edges
            distanceGain.gain.value = Math.max(0.3, distanceVolume); // Minimum 30% volume
        } else {
            // Default center position
            panNode.pan.value = 0;
            distanceGain.gain.value = 0.6;
        }
        
        // Create reverb effect using pre-generated data or fallback
        const convolver = this.audioContext.createConvolver();
        
        if (reverbData) {
            // Use pre-generated reverb from worker
            const reverbDuration = 4;
            const reverbBuffer = this.audioContext.createBuffer(2, reverbData.length / 2, this.audioContext.sampleRate);
            reverbBuffer.copyToChannel(reverbData.slice(0, reverbData.length / 2), 0);
            reverbBuffer.copyToChannel(reverbData.slice(reverbData.length / 2), 1);
            convolver.buffer = reverbBuffer;
        } else {
            // Fallback: generate reverb on main thread (simplified)
            const reverbDuration = 2; // Shorter for fallback
            const reverbBuffer = this.audioContext.createBuffer(2, this.audioContext.sampleRate * reverbDuration, this.audioContext.sampleRate);
            
            for (let channel = 0; channel < 2; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    const t = i / this.audioContext.sampleRate;
                    channelData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 1.2) * 0.4;
                }
            }
            convolver.buffer = reverbBuffer;
        }
        
        // Apply additional filtering for thunder character
        const thunderFilter = this.audioContext.createBiquadFilter();
        thunderFilter.type = 'lowpass';
        thunderFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        thunderFilter.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + duration);
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
        
        // Connect audio graph with spatial processing
        thunderSource.connect(thunderFilter);
        thunderFilter.connect(bodyFilter);
        bodyFilter.connect(distanceGain); // Apply distance-based volume
        distanceGain.connect(dryGain);
        bodyFilter.connect(convolver);
        convolver.connect(wetGain);
        
        // Apply panning to both dry and wet signals
        dryGain.connect(panNode);
        wetGain.connect(panNode);
        panNode.connect(this.audioContext.destination);
        
        thunderSource.start();
        thunderSource.stop(this.audioContext.currentTime + duration);
    }
    
    startSunHumSound() {
        if (!this.audioContext) return;
        
        console.log('Starting sun humming sound');
        
        // Sun humming configuration - G, A, B, D notes across multiple octaves
        const sunNotes = [
            // Lower octaves for more bass
            { frequency: 98.00, name: 'G2' },   // G in 2nd octave
            { frequency: 110.00, name: 'A2' },  // A in 2nd octave
            { frequency: 123.47, name: 'B2' },  // B in 2nd octave
            { frequency: 146.83, name: 'D3' },  // D in 3rd octave
            
            // Middle octaves
            { frequency: 196.00, name: 'G3' },  // G in 3rd octave
            { frequency: 220.00, name: 'A3' },  // A in 3rd octave  
            { frequency: 246.94, name: 'B3' },  // B in 3rd octave
            { frequency: 293.66, name: 'D4' },  // D in 4th octave
            
            // Higher octaves (original)
            { frequency: 392.00, name: 'G4' },  // G in 4th octave
            { frequency: 440.00, name: 'A4' },  // A in 4th octave  
            { frequency: 493.88, name: 'B4' },  // B in 4th octave
            { frequency: 587.33, name: 'D5' }   // D in 5th octave
        ];
        
        // Create gain for overall sun hum volume
        this.sunGain = this.audioContext.createGain();
        this.sunGain.gain.value = 0.20; // Increased from 0.12 to 0.20
        
        // Create low-pass filter for warmth
        this.sunFilter = this.audioContext.createBiquadFilter();
        this.sunFilter.type = 'lowpass';
        this.sunFilter.frequency.value = 150; // Lower cutoff for more bass
        this.sunFilter.Q.value = 0.8;
        
        // Create subtle LFO for gentle variation
        this.sunLfo = this.audioContext.createOscillator();
        this.sunLfo.frequency.value = 0.08; // Even slower variation
        this.sunLfo.type = 'sine';
        
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 0.03; // Very subtle modulation
        
        // Store oscillators and their trigger times for random triggering
        this.sunOscillators = [];
        this.sunNoteTriggers = [];
        
        sunNotes.forEach((note, index) => {
            const osc = this.audioContext.createOscillator();
            const oscGain = this.audioContext.createGain();
            const noteGain = this.audioContext.createGain(); // For ADSR
            
            osc.type = 'sine'; // Pure sine waves for clean hum
            osc.frequency.value = note.frequency;
            
            // Set individual note gain based on octave (lower octaves quieter)
            const octaveMultiplier = index < 4 ? 0.3 : (index < 8 ? 0.5 : 0.7);
            noteGain.gain.value = 0; // Start silent, will be triggered by ADSR
            
            oscGain.gain.value = 0.2 * octaveMultiplier; // Base gain per note
            
            // Connect with LFO modulation for gentle variation
            this.sunLfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            // Route through ADSR gain, then filter and main gain
            osc.connect(noteGain);
            noteGain.connect(oscGain);
            oscGain.connect(this.sunFilter);
            
            // Store for triggering
            this.sunOscillators.push({ 
                osc, 
                gain: oscGain, 
                noteGain: noteGain, 
                note: note.name,
                frequency: note.frequency 
            });
            
            // Start oscillator
            osc.start();
        });
        
        // Connect filter to main gain
        this.sunFilter.connect(this.sunGain);
        this.sunGain.connect(this.audioContext.destination);
        
        // Start LFO
        this.sunLfo.start();
        
        // Start random note triggering with ADSR envelopes
        this.startSunNoteTriggers();
        
        console.log('Sun humming sound started successfully');
    }
    
    startSunNoteTriggers() {
        const triggerRandomNote = () => {
            if (!this.sunOscillators || this.currentWeather !== 'sunny') return;
            
            // Select random note, preferring middle octaves
            const weights = [0.05, 0.05, 0.05, 0.05, 0.15, 0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1];
            const randomIndex = this.weightedRandom(weights);
            const selectedNote = this.sunOscillators[randomIndex];
            
            // Apply ADSR envelope
            this.applySunADSR(selectedNote);
            
            // Schedule next trigger
            const nextTriggerTime = 0.5 + Math.random() * 2; // 0.5-2.5 seconds
            setTimeout(triggerRandomNote, nextTriggerTime * 1000);
        };
        
        // Start triggering notes
        setTimeout(triggerRandomNote, 100); // Start after 100ms
    }
    
    applySunADSR(noteOsc) {
        const currentTime = this.audioContext.currentTime;
        const noteGain = noteOsc.noteGain;
        
        // ADSR parameters for smooth, gentle humming
        const attack = 0.8;    // Slow attack for gentle fade-in
        const decay = 1.5;     // Medium decay
        const sustain = 0.3;   // Low sustain level
        const release = 2.0;  // Long release for smooth fade-out
        
        // Calculate target gain based on octave
        const baseGain = noteOsc.frequency < 200 ? 0.4 : (noteOsc.frequency < 400 ? 0.6 : 0.8);
        const targetGain = baseGain * 0.5;
        
        // Attack - fade in
        noteGain.gain.cancelScheduledValues(currentTime);
        noteGain.gain.setValueAtTime(0, currentTime);
        noteGain.gain.linearRampToValueAtTime(targetGain, currentTime + attack);
        
        // Decay - drop to sustain level
        noteGain.gain.linearRampToValueAtTime(targetGain * sustain, currentTime + attack + decay);
        
        // Release - fade out after sustain period
        const sustainDuration = 1 + Math.random() * 3; // 1-4 seconds sustain
        noteGain.gain.linearRampToValueAtTime(0, currentTime + attack + decay + sustainDuration + release);
    }
    
    weightedRandom(weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return i;
        }
        return weights.length - 1;
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
        
        // Create LFO for siren effect - use timing delay for phase offset
        this.sirenLFO = this.audioContext.createOscillator();
        this.sirenLFO.frequency.value = sirenConfig.frequency.sweepRate;
        this.sirenLFO.type = 'sine';
        
        // Start LFO immediately so it's running when oscillators start
        this.sirenLFO.start();
        
        // Create gain for LFO to control frequency modulation
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = (sirenConfig.frequency.max - sirenConfig.frequency.min) / 2; // Half range
        
        // Create constant offset for center frequency
        const offsetGain = this.audioContext.createGain();
        offsetGain.gain.value = (sirenConfig.frequency.min + sirenConfig.frequency.max) / 2; // Center frequency
        
        // Connect LFO before starting oscillators
        this.sirenLFO.connect(lfoGain);
        
        // Connect modulation and offset to all oscillators
        this.sirenOscillators.forEach(({ osc }) => {
            lfoGain.connect(osc.frequency);
            offsetGain.connect(osc.frequency);
        });
        
        // Create main gain control with volume hack for phase
        this.sirenGain.gain.setValueAtTime(0, this.audioContext.currentTime); // Start silent
        
        // Start all oscillators immediately (no phase delay)
        this.sirenOscillators.forEach(({ osc }) => {
            osc.start();
        });
        
        // Wait for LFO to reach bottom point (3/4 period), then restore volume
        const restoreTime = this.audioContext.currentTime + (3 / (sirenConfig.frequency.sweepRate * 4)); // 3/4 period to reach bottom
        this.sirenGain.gain.linearRampToValueAtTime(sirenConfig.gain.main, restoreTime + 0.1); // Restore volume
        
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
        highPassFilter.frequency.value = 400; // Increased from 200 to mute more low frequencies
        highPassFilter.Q.value = 0.8; // Higher Q for smoother transition
        
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
