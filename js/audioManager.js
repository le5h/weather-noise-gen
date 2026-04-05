/**
 * Audio Manager
 * Handles weather sound effects using Web Audio API
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.currentWeather = 'snow';
        this.initialized = false;
        this.thunderWorker = null;
        this.pendingThunder = null;

        // Unified node tracking: name -> { sources: [], gains: [], lfos: [], filters: [], oscillators: [] }
        this.activeNodes = new Map();
    }

    // ============ UTILITY FUNCTIONS ============

    createNoiseBuffer(amplitude, durationSeconds) {
        const bufferSize = this.audioContext.sampleRate * durationSeconds;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * amplitude;
        }
        return buffer;
    }

    createNoiseSource(buffer) {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    }

    createFilter(type, frequency, q = 1) {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = q;
        return filter;
    }

    createLFO(frequency, type = 'sine') {
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = frequency;
        lfo.type = type;
        return lfo;
    }

    createGain(value = 1) {
        const gain = this.audioContext.createGain();
        gain.gain.value = value;
        return gain;
    }

    safeStop(node) {
        if (!node) return;
        try {
            if (typeof node.stop === 'function') node.stop();
            if (typeof node.disconnect === 'function') node.disconnect();
        } catch (e) {}
    }

    // ============ NODE TRACKING SYSTEM ============

    registerNodes(name, nodes) {
        if (!this.activeNodes.has(name)) {
            this.activeNodes.set(name, { sources: [], gains: [], lfos: [], filters: [], oscillators: [], other: [], paramConnections: [] });
        }
        const entry = this.activeNodes.get(name);
        for (const [key, value] of Object.entries(nodes)) {
            if (entry[key] && Array.isArray(value)) {
                entry[key].push(...value.filter(n => n));
            } else if (entry[key] && value) {
                entry[key].push(value);
            }
        }
    }

    registerParamConnection(name, fromNode, toParam) {
        if (!this.activeNodes.has(name)) return;
        const entry = this.activeNodes.get(name);
        entry.paramConnections.push({ from: fromNode, to: toParam });
    }

    stopAndClear(name) {
        const nodes = this.activeNodes.get(name);
        if (!nodes) return;

        // First disconnect all parameter connections (LFOs from AudioParams)
        if (nodes.paramConnections) {
            for (const conn of nodes.paramConnections) {
                try { conn.from.disconnect(conn.to); } catch (e) {}
            }
        }

        for (const source of nodes.sources) this.safeStop(source);
        for (const lfo of nodes.lfos) this.safeStop(lfo);
        for (const osc of nodes.oscillators) this.safeStop(osc);
        for (const gain of nodes.gains) this.safeStop(gain);
        for (const filter of nodes.filters) this.safeStop(filter);
        for (const other of nodes.other) this.safeStop(other);

        this.activeNodes.delete(name);
    }

    stopAllSounds() {
        for (const name of this.activeNodes.keys()) {
            this.stopAndClear(name);
        }
        this.activeNodes.clear();
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
    
    // ============ CONFIG-DRIVEN SIMPLE SOUNDS ============

    startSimpleNoiseSound(name, config) {
        if (!this.audioContext) return;
        console.log(`Starting ${name} sound`);

        const buffer = this.createNoiseBuffer(config.amplitude, config.duration || 2);
        const source = this.createNoiseSource(buffer);
        const filter = this.createFilter(config.filterType, config.frequency, config.q || 1);
        const gain = this.createGain(config.gain);

        const nodes = { sources: [source], filters: [filter], gains: [gain] };

        if (config.lfo) {
            const lfo = this.createLFO(config.lfo.rate, config.lfo.type || 'sine');
            const lfoGain = this.createGain(config.lfo.depth);
            lfo.connect(lfoGain);
            const targetParam = config.lfo.target === 'filter' ? filter.frequency : gain.gain;
            lfoGain.connect(targetParam);
            lfo.start();
            nodes.lfos = [lfo, lfoGain];
            this.registerParamConnection(name, lfoGain, targetParam);
        }

        if (config.secondFilter) {
            const filter2 = this.createFilter(config.secondFilter.type, config.secondFilter.frequency, config.secondFilter.q || 1);
            source.connect(filter);
            filter.connect(filter2);
            filter2.connect(gain);
            nodes.filters.push(filter2);
        } else {
            source.connect(filter);
            filter.connect(gain);
        }

        gain.connect(this.audioContext.destination);
        source.start();

        this.registerNodes(name, nodes);
        console.log(`${name} sound started successfully`);
    }

    // ============ LAYERED SOUND SYSTEM ============

    startLayeredSound(name, layers, masterGainValue) {
        if (!this.audioContext) return;

        const masterGain = this.createGain(masterGainValue);
        const allNodes = { sources: [], gains: [masterGain], lfos: [], filters: [] };

        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            
            const buffer = this.createNoiseBuffer(layer.amplitude, layer.bufferDuration || 3);
            const source = this.createNoiseSource(buffer);
            allNodes.sources.push(source);
            
            const filter = this.createFilter(layer.filterType, layer.frequency, layer.q || 1);
            allNodes.filters.push(filter);

            source.connect(filter);

            let lastNode = filter;

            if (layer.lfo) {
                const lfo = this.createLFO(layer.lfo.rate);
                const lfoGain = this.createGain(layer.lfo.depth);
                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);
                lfo.start();
                allNodes.lfos.push(lfo, lfoGain);
                this.registerParamConnection(name, lfoGain, filter.frequency);
            }

            if (layer.burstLfo) {
                const burstLfo = this.createLFO(layer.burstLfo.rate);
                const burstGain = this.createGain(layer.burstLfo.depth);
                const layerGain = this.createGain(layer.burstLfo.baseGain || 0.4);

                burstLfo.connect(burstGain);
                burstGain.connect(layerGain.gain);
                burstLfo.start();
                this.registerParamConnection(name, burstGain, layerGain.gain);

                filter.connect(layerGain);
                layerGain.connect(masterGain);
                allNodes.lfos.push(burstLfo, burstGain);
                allNodes.gains.push(layerGain);
                lastNode = null;
            } else if (layer.envelope) {
                const envelope = this.createGain(layer.envelope.base);
                if (layer.envelope.lfo) {
                    const lfo = this.createLFO(layer.envelope.lfo.rate);
                    const lfoGain = this.createGain(1);
                    lfo.connect(lfoGain);
                    lfoGain.gain.value = layer.envelope.lfo.depth;
                    lfoGain.connect(envelope.gain);
                    lfo.start();
                    allNodes.lfos.push(lfo, lfoGain);
                    this.registerParamConnection(name, lfoGain, envelope.gain);
                    envelope.gain.value = layer.envelope.base;
                }
                filter.connect(envelope);

                const layerGain = this.createGain(layer.layerGain || 0.5);
                envelope.connect(layerGain);
                layerGain.connect(masterGain);
                allNodes.gains.push(envelope, layerGain);
                lastNode = null;
            } else if (layer.limiter) {
                const limiter = this.createGain(layer.limiter.base);
                filter.connect(limiter);
                limiter.connect(masterGain);
                allNodes.gains.push(limiter);
                lastNode = null;
            }

            if (lastNode) {
                lastNode.connect(masterGain);
            }

            source.start();
        }

        masterGain.connect(this.audioContext.destination);
        this.registerNodes(name, allNodes);
    }

    // ============ WEATHER SOUND METHODS ============

    startWindSound() {
        this.startSimpleNoiseSound('wind', {
            amplitude: 0.1,
            duration: 2,
            filterType: 'lowpass',
            frequency: 400,
            q: 1,
            gain: 0.3,
            lfo: { rate: 0.2, depth: 50, target: 'filter' }
        });
    }

    startRainSound() {
        this.startSimpleNoiseSound('rain', {
            amplitude: 0.06,
            duration: 2,
            filterType: 'bandpass',
            frequency: 1500,
            q: 0.8,
            gain: 0.15
        });
    }

    startWindHowlSound() {
        this.startSimpleNoiseSound('windHowl', {
            amplitude: 0.08,
            duration: 3,
            filterType: 'lowpass',
            frequency: 800,
            q: 2,
            gain: 0.2,
            lfo: { rate: 0.3, depth: 300, target: 'filter' },
            secondFilter: { type: 'bandpass', frequency: 400, q: 5 }
        });
    }

    startThunderRainSound() {
        this.startSimpleNoiseSound('thunderRain', {
            amplitude: 0.08,
            duration: 2,
            filterType: 'lowpass',
            frequency: 1200,
            q: 1.5,
            gain: 0.12,
            secondFilter: { type: 'bandpass', frequency: 800, q: 2 }
        });
    }

    startRiverSound() {
        this.startLayeredSound('river', [
            { amplitude: 0.04, bufferDuration: 4, filterType: 'lowpass', frequency: 200, q: 0.6,
              lfo: { rate: 0.1, depth: 0.6 }, burstLfo: { rate: 0.05, depth: 0.175, baseGain: 0.25 } },
            { amplitude: 0.03, bufferDuration: 4, filterType: 'bandpass', frequency: 1500, q: 2.5,
              lfo: { rate: 0.18, depth: 0.8 }, burstLfo: { rate: 0.08, depth: 0.175, baseGain: 0.25 } },
            { amplitude: 0.02, bufferDuration: 4, filterType: 'highpass', frequency: 2500, q: 0.3,
              lfo: { rate: 0.26, depth: 1.0 }, burstLfo: { rate: 0.11, depth: 0.175, baseGain: 0.25 } }
        ], 0.2);
    }

    startTreeNoiseSound() {
        this.startLayeredSound('tree', [
            { amplitude: 0.03, bufferDuration: 3, filterType: 'lowpass', frequency: 300, q: 0.8,
              burstLfo: { rate: 0.2, depth: 0.3, baseGain: 0.4 } },
            { amplitude: 0.025, bufferDuration: 3, filterType: 'bandpass', frequency: 1200, q: 2.0,
              burstLfo: { rate: 0.3, depth: 0.3, baseGain: 0.4 } },
            { amplitude: 0.02, bufferDuration: 3, filterType: 'highpass', frequency: 2000, q: 1.2,
              burstLfo: { rate: 0.4, depth: 0.3, baseGain: 0.4 } }
        ], 0.15);
    }

    startOceanSound() {
        this.startLayeredSound('ocean', [
            { amplitude: 0.06, bufferDuration: 5, filterType: 'lowpass', frequency: 300, q: 0.8,
              envelope: { base: 0.3, lfo: { rate: 0.1 + Math.random() * 0.15, depth: 0.4 } }, layerGain: 0.5 },
            { amplitude: 0.04, bufferDuration: 5, filterType: 'bandpass', frequency: 800, q: 1.5,
              envelope: { base: 0.3, lfo: { rate: 0.1 + Math.random() * 0.15, depth: 0.4 } }, layerGain: 0.7 },
            { amplitude: 0.03, bufferDuration: 5, filterType: 'highpass', frequency: 2000, q: 0.5,
              envelope: { base: 0.3, lfo: { rate: 0.1 + Math.random() * 0.15, depth: 0.4 } }, layerGain: 0.4 }
        ], 0.25);
    }

    startThunderSound() {
        if (!this.audioContext) return;
        this.startThunderRainSound();

        this.generateThunder = (positionData = null) => {
            const thunderDuration = 2 + Math.random() * 3;
            if (this.thunderWorker) {
                this.thunderWorker.postMessage({
                    type: 'generateThunder',
                    sampleRate: this.audioContext.sampleRate,
                    duration: thunderDuration,
                    position: positionData
                });
            } else {
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

        const sunNotes = [
            { frequency: 98.00, name: 'G2' }, { frequency: 110.00, name: 'A2' },
            { frequency: 123.47, name: 'B2' }, { frequency: 146.83, name: 'D3' },
            { frequency: 196.00, name: 'G3' }, { frequency: 220.00, name: 'A3' },
            { frequency: 246.94, name: 'B3' }, { frequency: 293.66, name: 'D4' },
            { frequency: 392.00, name: 'G4' }, { frequency: 440.00, name: 'A4' },
            { frequency: 493.88, name: 'B4' }, { frequency: 587.33, name: 'D5' }
        ];

        const masterGain = this.createGain(0.20);
        const filter = this.createFilter('lowpass', 150, 0.8);
        const lfo = this.createLFO(0.08, 'sine');
        const lfoGain = this.createGain(0.03);

        const oscillators = [];
        const allGains = [masterGain, lfoGain];

        sunNotes.forEach((note, index) => {
            const osc = this.audioContext.createOscillator();
            const oscGain = this.createGain(0.2 * (index < 4 ? 0.3 : (index < 8 ? 0.5 : 0.7)));
            const noteGain = this.createGain(0);

            osc.type = 'sine';
            osc.frequency.value = note.frequency;

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            osc.connect(noteGain);
            noteGain.connect(oscGain);
            oscGain.connect(filter);

            oscillators.push({ osc, gain: oscGain, noteGain, note: note.name, frequency: note.frequency });
            allGains.push(oscGain, noteGain);
            osc.start();
        });

        filter.connect(masterGain);
        masterGain.connect(this.audioContext.destination);
        lfo.start();

        this.registerNodes('sun', { oscillators: oscillators.map(o => o.osc), gains: allGains, filters: [filter], lfos: [lfo] });
        this.sunOscillators = oscillators;
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

        const sirenConfig = {
            oscillators: [
                { gain: 0.25, pan: -0.8 }, { gain: 0.20, pan: -0.3 },
                { gain: 0.15, pan: 0.3 }, { gain: 0.10, pan: 0.8 }
            ],
            frequency: { min: 100, max: 400, sweepRate: 0.05 },
            gain: { main: 0.04, dry: 0.5, wet: 0.5, feedback: 0.4 },
            delay: { time: 1.5, maxDelay: 2.0 },
            filters: {
                lowpass: { dryFreq: 1200, dryQ: 1.5, echoFreq: 800, echoQ: 2 },
                highpass: { freq: 400, q: 0.8 }
            }
        };

        const masterGain = this.createGain(0);
        const lfo = this.createLFO(sirenConfig.frequency.sweepRate, 'sine');
        const lfoGain = this.createGain((sirenConfig.frequency.max - sirenConfig.frequency.min) / 2);
        const offsetGain = this.createGain((sirenConfig.frequency.min + sirenConfig.frequency.max) / 2);

        const oscillators = [];
        const panners = [];
        const gains = [masterGain, lfoGain, offsetGain];
        const filters = [];

        // Create oscillators with panners
        sirenConfig.oscillators.forEach(config => {
            const osc = this.audioContext.createOscillator();
            const panner = this.audioContext.createStereoPanner();
            const gain = this.createGain(config.gain);

            osc.type = 'sawtooth';
            panner.pan.value = config.pan;

            osc.connect(gain);
            gain.connect(panner);
            panner.connect(masterGain);

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            offsetGain.connect(osc.frequency);

            oscillators.push(osc);
            panners.push(panner);
            gains.push(gain);
            osc.start();
        });

        // Restore volume after LFO phase sync
        const restoreTime = this.audioContext.currentTime + (3 / (sirenConfig.frequency.sweepRate * 4));
        masterGain.gain.linearRampToValueAtTime(sirenConfig.gain.main, restoreTime + 0.1);

        // Create delay/echo effect
        const delayNode = this.audioContext.createDelay(sirenConfig.delay.maxDelay);
        delayNode.delayTime.value = sirenConfig.delay.time;
        const feedbackGain = this.createGain(sirenConfig.gain.feedback);
        const wetGain = this.createGain(sirenConfig.gain.wet);
        const dryGain = this.createGain(sirenConfig.gain.dry);

        gains.push(feedbackGain, wetGain, dryGain);

        masterGain.connect(dryGain);
        dryGain.connect(this.audioContext.destination);

        masterGain.connect(delayNode);
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        delayNode.connect(wetGain);
        wetGain.connect(this.audioContext.destination);

        // Add filters
        const sirenFilter = this.createFilter('lowpass', sirenConfig.filters.lowpass.dryFreq, sirenConfig.filters.lowpass.dryQ);
        const echoFilter = this.createFilter('lowpass', sirenConfig.filters.lowpass.echoFreq, sirenConfig.filters.lowpass.echoQ);
        const highPassFilter = this.createFilter('highpass', sirenConfig.filters.highpass.freq, sirenConfig.filters.highpass.q);

        filters.push(sirenFilter, echoFilter, highPassFilter);

        dryGain.disconnect();
        dryGain.connect(sirenFilter);
        sirenFilter.connect(highPassFilter);
        highPassFilter.connect(this.audioContext.destination);

        wetGain.disconnect();
        wetGain.connect(echoFilter);
        echoFilter.connect(highPassFilter);

        lfo.start();

        this.registerNodes('siren', { oscillators, gains, lfos: [lfo], filters, other: [delayNode, ...panners] });

        console.log('Siren sound started successfully');
    }
}
