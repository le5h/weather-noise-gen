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
        this.masterGain = null;

        // Unified node tracking: name -> { sources: [], gains: [], lfos: [], filters: [], oscillators: [] }
        this.activeNodes = new Map();

        // Prime durations for cicada noise (coprime lengths for long combined loop)
        this.PRIME_DURATIONS = [17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];

        // Scheduled drift timeouts
        this.driftTimeouts = [];
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

    createInvertedCosineLFO(frequency) {
        // Creates -cos(t) wave: starts at -1, rises through center (0) to +1
        // real[1] = -1 gives -cos(ωt), imag[1] = 0 removes sin component
        const real = new Float32Array([0, -1]);
        const imag = new Float32Array([0, 0]);
        const periodicWave = this.audioContext.createPeriodicWave(real, imag);
        
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = frequency;
        lfo.setPeriodicWave(periodicWave);
        return lfo;
    }

    createGain(value = 1) {
        const gain = this.audioContext.createGain();
        gain.gain.value = value;
        return gain;
    }

    createWetDryMix(dryRatio = 0.5, wetRatio = 0.5) {
        const dryGain = this.createGain(dryRatio);
        const wetGain = this.createGain(wetRatio);
        return { dryGain, wetGain };
    }

    createSpatializer(positionData) {
        const panNode = this.audioContext.createStereoPanner();
        const distanceGain = this.createGain();

        if (positionData) {
            panNode.pan.value = positionData.pan;
            const distanceVolume = 1 - (positionData.distance * 0.5);
            distanceGain.gain.value = Math.max(0.3, distanceVolume);
        } else {
            panNode.pan.value = 0;
            distanceGain.gain.value = 0.6;
        }

        return { panNode, distanceGain };
    }

    createDelayEffect(delayTime, feedbackGain, wetRatio = 0.5, dryRatio = 0.5) {
        const delayNode = this.audioContext.createDelay(Math.max(delayTime + 0.5, 2.0));
        delayNode.delayTime.value = delayTime;

        const feedback = this.createGain(feedbackGain);
        const { dryGain, wetGain } = this.createWetDryMix(dryRatio, wetRatio);

        delayNode.connect(feedback);
        feedback.connect(delayNode);

        return { delayNode, feedback, dryGain, wetGain };
    }

    createFilterChain(filterConfigs) {
        const filters = filterConfigs.map(cfg => this.createFilter(cfg.type, cfg.frequency, cfg.q || 1));
        for (let i = 0; i < filters.length - 1; i++) {
            filters[i].connect(filters[i + 1]);
        }
        return filters;
    }

    createOscillatorBank(configs, { lfo = null, lfoDepth = 0, masterGain = null } = {}) {
        const oscillators = [];
        const gains = [];
        const panners = [];
        const lfos = [];

        const lfoGain = lfo ? this.createGain(lfoDepth) : null;
        if (lfo && lfoGain) {
            lfo.connect(lfoGain);
            lfos.push(lfoGain);
        }

        configs.forEach(cfg => {
            const osc = this.audioContext.createOscillator();
            const gain = this.createGain(cfg.gain || 0.2);

            osc.type = cfg.type || 'sine';
            osc.frequency.value = cfg.frequency;

            if (lfoGain && cfg.modulate !== false) {
                lfoGain.connect(osc.frequency);
            }

            let lastNode = osc;

            if (cfg.pan !== undefined) {
                const panner = this.audioContext.createStereoPanner();
                panner.pan.value = cfg.pan;
                lastNode.connect(gain);
                gain.connect(panner);
                panners.push(panner);
                lastNode = panner;
            } else {
                lastNode.connect(gain);
            }

            oscillators.push(osc);
            gains.push(gain);
            osc.start();
        });

        if (masterGain) {
            [...panners, ...gains.filter((_, i) => !configs[i].pan !== undefined)].forEach(node => {
                if (!panners.includes(node)) node.connect(masterGain);
            });
            panners.forEach(p => p.connect(masterGain));
        }

        return { oscillators, gains, panners, lfos };
    }

    safeStop(node) {
        if (!node) return;
        try {
            if (typeof node.stop === 'function') node.stop();
            if (typeof node.disconnect === 'function') node.disconnect();
        } catch (e) {}
    }

    connectLFO(rate, targetParam, depth, name, type = 'sine') {
        const lfo = this.createLFO(rate, type);
        const lfoGain = this.createGain(depth);
        lfo.connect(lfoGain);
        lfoGain.connect(targetParam);
        lfo.start();
        this.registerParamConnection(name, lfoGain, targetParam);
        return { lfo, lfoGain };
    }

    calculateEnvelopeValue(t, { attack, decay, sustain, release, sustainDuration = 0 }) {
        if (t < attack) {
            return t / attack;
        } else if (t < attack + decay) {
            return 1 - ((t - attack) / decay) * (1 - sustain);
        } else if (t < attack + decay + sustainDuration) {
            return sustain;
        } else {
            const releaseProgress = (t - attack - decay - sustainDuration) / release;
            return sustain * Math.exp(-releaseProgress * 2);
        }
    }

    scheduleADSR(gainNode, startTime, targetGain, { attack, decay, sustain, release, sustainDuration }) {
        gainNode.gain.cancelScheduledValues(startTime);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(targetGain, startTime + attack);
        gainNode.gain.linearRampToValueAtTime(targetGain * sustain, startTime + attack + decay);
        gainNode.gain.linearRampToValueAtTime(0, startTime + attack + decay + sustainDuration + release);
    }

    createReverbBuffer(duration, decayRate = 1.2, amplitude = 0.4, channels = 2) {
        const buffer = this.audioContext.createBuffer(channels, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < channels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                const t = i / this.audioContext.sampleRate;
                channelData[i] = (Math.random() * 2 - 1) * Math.exp(-t * decayRate) * amplitude;
            }
        }
        return buffer;
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

        // Clear drift modulation timeouts
        for (const tid of this.driftTimeouts) {
            clearTimeout(tid);
        }
        this.driftTimeouts = [];
        this._globalDriftStarted = false;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume context if suspended (browser policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Create master gain node (all audio routes through this)
            this.masterGain = this.createGain(0.8);
            this.masterGain.connect(this.audioContext.destination);
            
            // Initialize thunder worker
            this.initThunderWorker();
            
            this.initialized = true;
            console.log('Audio initialized successfully');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    setVolume(value) {
        if (this.masterGain) {
            const now = this.audioContext.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(value, now + 0.1);
        }
    }

    startGlobalDrift() {
        if (!this.masterGain || this._globalDriftStarted) return;
        this._globalDriftStarted = true;
        this.startDriftModulation('_globalDrift', this.masterGain, [0.03, 0.08], [0.02, 0.06], [15, 40]);
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

        if (this.currentWeather === weather) {
            console.log('Already in weather mode:', weather);
            return;
        }
        
        console.log('Setting weather audio to:', weather);
        this.stopAllSounds();
        this.currentWeather = weather;
        this.startGlobalDrift();
        
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
            const targetParam = config.lfo.target === 'filter' ? filter.frequency : gain.gain;
            const { lfo, lfoGain } = this.connectLFO(config.lfo.rate, targetParam, config.lfo.depth, name, config.lfo.type || 'sine');
            nodes.lfos = [lfo, lfoGain];
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

        gain.connect(this.masterGain);
        source.start();

        this.registerNodes(name, nodes);
        console.log(`${name} sound started successfully`);
    }

    // ============ CICADA NOISE & DRIFT MODULATION ============

    getPrimeDuration(index) {
        return this.PRIME_DURATIONS[index % this.PRIME_DURATIONS.length];
    }

    getCicadaDurations(count) {
        const start = Math.floor(Math.random() * (this.PRIME_DURATIONS.length - count));
        return this.PRIME_DURATIONS.slice(start, start + count);
    }

    startDriftModulation(name, gainNode, rateRange, depthRange, intervalRange) {
        if (!this.audioContext || !gainNode) return;

        const rate = rateRange[0] + Math.random() * (rateRange[1] - rateRange[0]);
        const depth = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0]);

        const lfo = this.createLFO(rate);
        const lfoGain = this.createGain(depth);
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfo.start();

        this.registerNodes(name, { lfos: [lfo, lfoGain] });
        this.registerParamConnection(name, lfoGain, gainNode.gain);

        const scheduleDrift = () => {
            const newRate = rateRange[0] + Math.random() * (rateRange[1] - rateRange[0]);
            const newDepth = depthRange[0] + Math.random() * (depthRange[1] - depthRange[0]);
            const nextInterval = intervalRange[0] + Math.random() * (intervalRange[1] - intervalRange[0]);

            const now = this.audioContext.currentTime;
            lfo.frequency.cancelScheduledValues(now);
            lfo.frequency.setValueAtTime(lfo.frequency.value, now);
            lfo.frequency.linearRampToValueAtTime(newRate, now + 2);

            lfoGain.gain.cancelScheduledValues(now);
            lfoGain.gain.setValueAtTime(lfoGain.gain.value, now);
            lfoGain.gain.linearRampToValueAtTime(newDepth, now + 2);

            const tid = setTimeout(scheduleDrift, nextInterval * 1000);
            this.driftTimeouts.push(tid);
        };

        const initTid = setTimeout(scheduleDrift, (intervalRange[0] + Math.random() * (intervalRange[1] - intervalRange[0])) * 1000);
        this.driftTimeouts.push(initTid);
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
                const { lfo, lfoGain } = this.connectLFO(layer.lfo.rate, filter.frequency, layer.lfo.depth, name);
                allNodes.lfos.push(lfo, lfoGain);
            }

            if (layer.burstLfo) {
                const layerGain = this.createGain(layer.burstLfo.baseGain || 0.4);
                const { lfo: burstLfo, lfoGain: burstGain } = this.connectLFO(layer.burstLfo.rate, layerGain.gain, layer.burstLfo.depth, name);

                filter.connect(layerGain);
                layerGain.connect(masterGain);
                allNodes.lfos.push(burstLfo, burstGain);
                allNodes.gains.push(layerGain);
                lastNode = null;
            } else if (layer.envelope) {
                const envelope = this.createGain(layer.envelope.base);
                if (layer.envelope.lfo) {
                    const { lfo, lfoGain } = this.connectLFO(layer.envelope.lfo.rate, envelope.gain, layer.envelope.lfo.depth, name);
                    envelope.gain.value = layer.envelope.base;
                    allNodes.lfos.push(lfo, lfoGain);
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

        masterGain.connect(this.masterGain);
        this.registerNodes(name, allNodes);
    }

    // ============ WEATHER SOUND METHODS ============

    startWindSound() {
        const durs = this.getCicadaDurations(3);
        this.startLayeredSound('wind', [
            { amplitude: 0.08, bufferDuration: durs[0], filterType: 'lowpass', frequency: 300, q: 0.8,
              lfo: { rate: 0.03, depth: 20 }, envelope: { base: 0.5, lfo: { rate: 0.05, depth: 0.08 } }, layerGain: 0.5 },
            { amplitude: 0.07, bufferDuration: durs[1], filterType: 'lowpass', frequency: 500, q: 0.6,
              lfo: { rate: 0.04, depth: 30 }, envelope: { base: 0.5, lfo: { rate: 0.07, depth: 0.06 } }, layerGain: 0.5 },
            { amplitude: 0.05, bufferDuration: durs[2], filterType: 'bandpass', frequency: 1200, q: 2.0,
              lfo: { rate: 0.05, depth: 50 }, envelope: { base: 0.45, lfo: { rate: 0.04, depth: 0.1 } }, layerGain: 0.4 }
        ], 0.7);
    }

    startRainSound() {
        const durs = this.getCicadaDurations(3);
        this.startLayeredSound('rain', [
            { amplitude: 0.06, bufferDuration: durs[0], filterType: 'bandpass', frequency: 1400, q: 0.5,
              lfo: { rate: 0.4, depth: 300 }, limiter: { base: 0.3 } },
            { amplitude: 0.05, bufferDuration: durs[1], filterType: 'bandpass', frequency: 2000, q: 0.4,
              lfo: { rate: 0.5, depth: 400 }, limiter: { base: 0.25 } },
            { amplitude: 0.04, bufferDuration: durs[2], filterType: 'lowpass', frequency: 500, q: 0.6,
              lfo: { rate: 0.15, depth: 150 }, limiter: { base: 0.2 } }
        ], 0.6);
    }

    startWindHowlSound() {
        const durs = this.getCicadaDurations(2);
        this.startLayeredSound('windHowl', [
            { amplitude: 0.07, bufferDuration: durs[0], filterType: 'lowpass', frequency: 600, q: 1.5,
              lfo: { rate: 0.15, depth: 250 }, envelope: { base: 0.4, lfo: { rate: 0.06, depth: 0.1 } }, layerGain: 0.5 },
            { amplitude: 0.06, bufferDuration: durs[1], filterType: 'lowpass', frequency: 1000, q: 1.0,
              lfo: { rate: 0.2, depth: 350 }, envelope: { base: 0.4, lfo: { rate: 0.08, depth: 0.08 } }, layerGain: 0.45 }
        ], 0.7);
    }

    startThunderRainSound() {
        const durs = this.getCicadaDurations(4);
        this.startLayeredSound('thunderRain', [
            { amplitude: 0.08, bufferDuration: durs[0], filterType: 'lowpass', frequency: 200, q: 0.7,
              lfo: { rate: 0.1, depth: 80 }, limiter: { base: 0.35 } },
            { amplitude: 0.06, bufferDuration: durs[1], filterType: 'bandpass', frequency: 1200, q: 1.2,
              lfo: { rate: 0.3, depth: 400 }, limiter: { base: 0.3 } },
            { amplitude: 0.04, bufferDuration: durs[2], filterType: 'lowpass', frequency: 3000, q: 0.5,
              lfo: { rate: 0.25, depth: 500 }, limiter: { base: 0.25 } },
            { amplitude: 0.03, bufferDuration: durs[3], filterType: 'highpass', frequency: 3000, q: 0.4,
              lfo: { rate: 0.35, depth: 600 }, limiter: { base: 0.2 } }
        ], 0.65);
    }

    startRiverSound() {
        const durs = this.getCicadaDurations(3);
        this.startLayeredSound('river', [
            { amplitude: 0.04, bufferDuration: durs[0], filterType: 'lowpass', frequency: 200, q: 0.6,
              lfo: { rate: 0.1, depth: 0.6 }, burstLfo: { rate: 0.05, depth: 0.175, baseGain: 0.25 } },
            { amplitude: 0.03, bufferDuration: durs[1], filterType: 'bandpass', frequency: 1500, q: 2.5,
              lfo: { rate: 0.18, depth: 0.8 }, burstLfo: { rate: 0.08, depth: 0.175, baseGain: 0.25 } },
            { amplitude: 0.02, bufferDuration: durs[2], filterType: 'highpass', frequency: 2500, q: 0.3,
              lfo: { rate: 0.26, depth: 1.0 }, burstLfo: { rate: 0.11, depth: 0.175, baseGain: 0.2 } }
        ], 0.6);
    }

    startTreeNoiseSound() {
        const durs = this.getCicadaDurations(3);
        this.startLayeredSound('tree', [
            { amplitude: 0.025, bufferDuration: durs[0], filterType: 'lowpass', frequency: 300, q: 0.8,
              burstLfo: { rate: 0.15, depth: 0.3, baseGain: 0.35 } },
            { amplitude: 0.02, bufferDuration: durs[1], filterType: 'bandpass', frequency: 1200, q: 2.0,
              burstLfo: { rate: 0.25, depth: 0.3, baseGain: 0.3 } },
            { amplitude: 0.015, bufferDuration: durs[2], filterType: 'highpass', frequency: 2000, q: 1.2,
              burstLfo: { rate: 0.35, depth: 0.3, baseGain: 0.25 } }
        ], 0.5);
    }

    startOceanSound() {
        const durs = this.getCicadaDurations(4);
        this.startLayeredSound('ocean', [
            { amplitude: 0.1, bufferDuration: durs[0], filterType: 'lowpass', frequency: 80, q: 1.2,
              envelope: { base: 0.5, lfo: { rate: 0.03, depth: 0.15 } }, layerGain: 0.6 },
            { amplitude: 0.08, bufferDuration: durs[1], filterType: 'lowpass', frequency: 200, q: 0.8,
              envelope: { base: 0.4, lfo: { rate: 0.05, depth: 0.2 } }, layerGain: 0.55 },
            { amplitude: 0.025, bufferDuration: durs[2], filterType: 'bandpass', frequency: 1000, q: 1.5,
              envelope: { base: 0.2, lfo: { rate: 0.06, depth: 0.15 } }, layerGain: 0.35 },
            { amplitude: 0.025, bufferDuration: durs[3], filterType: 'highpass', frequency: 2000, q: 0.5,
              envelope: { base: 0.25, lfo: { rate: 0.08, depth: 0.15 } }, layerGain: 0.35 }
        ], 0.7);
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
        const { panNode, distanceGain } = this.createSpatializer(positionData);
        
        // Create reverb effect using pre-generated data or fallback
        const convolver = this.audioContext.createConvolver();
        
        if (reverbData) {
            const reverbBuffer = this.audioContext.createBuffer(2, reverbData.length / 2, this.audioContext.sampleRate);
            reverbBuffer.copyToChannel(reverbData.slice(0, reverbData.length / 2), 0);
            reverbBuffer.copyToChannel(reverbData.slice(reverbData.length / 2), 1);
            convolver.buffer = reverbBuffer;
        } else {
            convolver.buffer = this.createReverbBuffer(2, 1.2, 0.4, 2);
        }
        
        // Apply additional filtering for thunder character
        const [thunderFilter, bodyFilter] = this.createFilterChain([
            { type: 'lowpass', frequency: 2000, q: 1.5 },
            { type: 'bandpass', frequency: 60, q: 0.8 }
        ]);
        thunderFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        thunderFilter.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + duration);
        
        const thunderGain = this.audioContext.createGain();
        thunderGain.gain.value = 0.6;
        
        // Create wet/dry mix with wetter reverb
        const { dryGain, wetGain } = this.createWetDryMix(0.3, 0.7);
        
        // Connect audio graph: source → filters → distance → wet/dry → panner → destination
        thunderSource.connect(thunderFilter);
        thunderFilter.connect(bodyFilter);
        bodyFilter.connect(distanceGain);
        distanceGain.connect(dryGain);
        bodyFilter.connect(convolver);
        convolver.connect(wetGain);
        dryGain.connect(panNode);
        wetGain.connect(panNode);
        panNode.connect(this.masterGain);
        
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

        const sunGain = this.createGain(0.5);
        const filter = this.createFilter('lowpass', 150, 0.8);
        const lfo = this.createLFO(0.08, 'sine');
        const lfoDepth = 0.03;

        // Create oscillator bank with per-note ADSR gains
        const sunConfigs = sunNotes.map((note, index) => ({
            frequency: note.frequency,
            gain: 0.2 * (index < 4 ? 0.3 : (index < 8 ? 0.5 : 0.7)),
            name: note.name
        }));

        const { oscillators, gains, lfos } = this.createOscillatorBank(sunConfigs, { lfo, lfoDepth });

        // Add ADSR envelope gains per note
        const noteGains = oscillators.map(() => this.createGain(0));
        const allGains = [...gains, sunGain, ...lfos, ...noteGains];

        // Re-chain: osc → noteGain → oscGain → filter → master
        oscillators.forEach((osc, i) => {
            const oscGain = gains[i];
            const noteGain = noteGains[i];
            osc.disconnect();
            osc.connect(noteGain);
            noteGain.connect(oscGain);
            oscGain.connect(filter);
        });

        filter.connect(sunGain);
        sunGain.connect(this.masterGain);
        lfo.start();

        this.registerNodes('sun', { oscillators, gains: allGains, filters: [filter], lfos: [lfo] });
        this.sunOscillators = oscillators.map((osc, i) => ({
            osc, gain: gains[i], noteGain: noteGains[i],
            note: sunNotes[i].name, frequency: sunNotes[i].frequency
        }));
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
        const baseGain = noteOsc.frequency < 200 ? 0.4 : (noteOsc.frequency < 400 ? 0.6 : 0.8);
        const targetGain = baseGain * 0.5;
        const sustainDuration = 1 + Math.random() * 3;
        
        this.scheduleADSR(noteOsc.noteGain, this.audioContext.currentTime, targetGain, {
            attack: 0.8,
            decay: 1.5,
            sustain: 0.3,
            release: 2.0,
            sustainDuration
        });
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
            gain: { main: 0.15, dry: 0.2, wet: 0.8, feedback: 0.7 },
            delay: { time: 1.5, maxDelay: 2.0 },
            filters: {
                lowpass: { dryFreq: 1200, dryQ: 1.5, echoFreq: 800, echoQ: 2 },
                highpass: { freq: 600, q: 0.6 }
            }
        };

        const sirenMaster = this.createGain(0);
        // Use -cos(t) LFO that starts at -1 (bottom), rises through center to +1
        const lfo = this.createInvertedCosineLFO(sirenConfig.frequency.sweepRate);
        const lfoDepth = (sirenConfig.frequency.max - sirenConfig.frequency.min) / 2;
        const centerFreq = (sirenConfig.frequency.min + sirenConfig.frequency.max) / 2;

        // Create oscillators with panning using bank helper
        const sirenOscConfigs = sirenConfig.oscillators.map(cfg => ({
            frequency: centerFreq,
            gain: cfg.gain,
            pan: cfg.pan,
            type: 'sawtooth'
        }));

        const { oscillators, gains, panners, lfos } = this.createOscillatorBank(sirenOscConfigs, { lfo, lfoDepth, masterGain: sirenMaster });

        const allGains = [...gains, sirenMaster, ...lfos];

        // Restore volume after LFO phase sync (original slow fade-in)
        const restoreTime = this.audioContext.currentTime + (3 / (sirenConfig.frequency.sweepRate * 4));
        sirenMaster.gain.linearRampToValueAtTime(sirenConfig.gain.main, restoreTime + 0.1);

        // Create delay/echo effect using helper
        const { delayNode, feedback, dryGain, wetGain } = this.createDelayEffect(
            sirenConfig.delay.time,
            sirenConfig.gain.feedback,
            sirenConfig.gain.wet,
            sirenConfig.gain.dry
        );

        gains.push(feedback, wetGain, dryGain);
        allGains.push(feedback, wetGain, dryGain);

        sirenMaster.connect(dryGain);
        sirenMaster.connect(delayNode);
        delayNode.connect(wetGain);

        // Add filters
        const filters = [
            this.createFilter('lowpass', sirenConfig.filters.lowpass.dryFreq, sirenConfig.filters.lowpass.dryQ),
            this.createFilter('lowpass', sirenConfig.filters.lowpass.echoFreq, sirenConfig.filters.lowpass.echoQ),
            this.createFilter('highpass', sirenConfig.filters.highpass.freq, sirenConfig.filters.highpass.q)
        ];
        const [sirenFilter, echoFilter, highPassFilter] = filters;

        dryGain.connect(sirenFilter);
        sirenFilter.connect(highPassFilter);
        highPassFilter.connect(this.masterGain);

        wetGain.connect(echoFilter);
        echoFilter.connect(highPassFilter);

        lfo.start();

        this.registerNodes('siren', { oscillators, gains: allGains, lfos: [lfo], filters, other: [delayNode, ...panners] });

        console.log('Siren sound started successfully');
    }
}
