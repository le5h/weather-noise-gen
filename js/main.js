/**
 * Main Weather Simulation Application
 * Coordinates all weather effects and user interactions
 */

import { WeatherRenderer } from './weatherRenderer.js';
import { AudioManager } from './audioManager.js';

class WeatherApp {
    constructor() {
        this.canvas = document.getElementById('weatherCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.weatherButtons = document.querySelectorAll('.weather-btn');
        this.weatherApp = document.querySelector('.weather-app');
        this.startScreen = document.getElementById('startScreen');
        this.startBtn = document.getElementById('startBtn');
        this.backBtn = document.getElementById('backBtn');
        this.bottomArea = document.querySelector('.bottom-area');
        this.weatherRow = document.querySelector('.weather-row');
        this.volumeRow = document.getElementById('volumeRow');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volValue = document.getElementById('volValue');
        this.layersRow = document.getElementById('layersRow');
        this.vibrationRow = document.getElementById('vibrationRow');
        this.vibrationBtn = this.vibrationRow.querySelector('.vib-toggle');
        this._vibrationSupported = false;
        try {
            this._vibrationSupported = 'vibrate' in navigator &&
                typeof navigator.vibrate === 'function' &&
                /Mobi|Android/i.test(navigator.userAgent);
        } catch (e) {}
        if (!this._vibrationSupported) {
            this.vibrationRow.style.display = 'none';
            this._vibrationMode = 'off';
        } else {
            const saved = localStorage.getItem('vibrationMode');
            this._vibrationMode = (saved === 'off' || saved === 'legacy' || saved === 'modern') ? saved : 'modern';
            this._updateVibrationUI();
        }
        
        this.currentWeather = 'snow';
        this.dpr = 1;
        this._dprState = 'init';        // 'init' | 'probing' | 'settled'
        this._fpsSamples = [];
        this._dprResult = null;         // { low: avg, high: avg }
        this.renderer = new WeatherRenderer(this.canvas);
        this.audioManager = new AudioManager();
        this.isStarted = false;
        this.settingsOpen = false;
        this.animationId = null;
        
        this.weatherConfig = {
            sunny: { name: 'Sunny', particles: 50 },
            snow: { name: 'Heavy Snow', particles: 200 },
            windy: { name: 'Windy Storm', particles: 150 },
            rain: { name: 'Rain', particles: 300 },
            thunder: { name: 'Thunderstorm', particles: 250 },
            foggy: { name: 'Foggy Ash', particles: 180 },
            ocean: { name: 'Ocean Waves', particles: 250 }
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this._lastFrameTime = 0;
        });

        this.showStartScreen();
    }
    
    showStartScreen() {
        this.startScreen.style.display = 'flex';
        this.bottomArea.style.display = 'none';
        // Show floating start button when back to start screen
        this.startBtn.style.display = 'block';
    }
    
    cleanup() {
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stop all sounds
        this.audioManager.stopAllSounds();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset weather renderer
        this.renderer.reset();
        
        // Reset state
        this.isStarted = false;
    }
    
    backToStart() {
        this.cleanup();
        
        // Reset background to default
        this.weatherApp.dataset.weather = 'snow';
        
        // Show start screen with fade effect
        this.startScreen.style.opacity = '0';
        this.startScreen.style.display = 'flex';
        this.startScreen.style.transition = 'opacity 0.3s ease-in';
        
        setTimeout(() => {
            this.startScreen.style.opacity = '1';
            this.bottomArea.style.display = 'none';
            this.volumeRow.style.display = 'none';
            if (this._vibrationSupported) this.vibrationRow.style.display = 'none';
            this.layersRow.style.display = 'none';
            this.layersRow.innerHTML = '';
            this.settingsBtn.classList.remove('active');
            this.settingsOpen = false;
            this.showStartScreen();
        }, 50);
    }
    
    startExperience() {
        this.isStarted = true;
        this.vibrate(30);
        
        // Hide floating start button when experience starts
        this.startBtn.style.display = 'none';
        
        // Select random weather mode
        const weatherTypes = Object.keys(this.weatherConfig);
        const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        this.currentWeather = randomWeather;
        
        // Update background immediately before fade starts
        this.weatherApp.dataset.weather = this.currentWeather;
        
        // Hide start screen with fade effect
        this.startScreen.style.opacity = '0';
        this.startScreen.style.transition = 'opacity 0.5s ease-out';
        
        setTimeout(() => {
            this.startScreen.style.display = 'none';
            this.bottomArea.style.display = 'flex';
            
            // Initialize audio and start weather
            this.audioManager.init();
            
            // Set initial volume from slider
            this.audioManager.setVolume(parseFloat(this.volumeSlider.value));
            
            // Set random weather and ensure UI is properly updated
            this.setWeather(this.currentWeather);
            
            // Force UI update to show active state
            this.updateUI(this.currentWeather);
            
            this.startAnimation();
        }, 500);
    }
    
    _applyDpr() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * this.dpr;
        this.canvas.height = h * this.dpr;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.renderer.resize(w, h);
    }

    setupCanvas() {
        this._applyDpr();
        window.addEventListener('resize', () => this._applyDpr());
    }
    
    setupEventListeners() {
        // Start button click
        this.startBtn.addEventListener('click', () => {
            this.startExperience();
        });
        
        // Back button click
        this.backBtn.addEventListener('click', () => {
            this.backToStart();
        });
        
        // Settings toggle
        this.settingsBtn.addEventListener('click', () => {
            this.settingsOpen = !this.settingsOpen;
            this.volumeRow.style.display = this.settingsOpen ? 'flex' : 'none';
            if (this._vibrationSupported) this.vibrationRow.style.display = this.settingsOpen ? 'flex' : 'none';
            this.layersRow.style.display = this.settingsOpen ? 'flex' : 'none';
            this.settingsBtn.classList.toggle('active', this.settingsOpen);
        });

        this.vibrationBtn.addEventListener('click', () => {
            const modes = ['off', 'modern', 'legacy'];
            const idx = modes.indexOf(this._vibrationMode);
            this._vibrationMode = modes[(idx + 1) % modes.length];
            localStorage.setItem('vibrationMode', this._vibrationMode);
            this._updateVibrationUI();
            if (this._vibrationMode !== 'off') this.vibrate(50);
        });

        // Volume slider
        this.volumeSlider.addEventListener('input', () => {
            const vol = parseFloat(this.volumeSlider.value);
            this.volValue.textContent = Math.round(vol * 100) + '%';
            this.audioManager.setVolume(vol);
            this.vibrate(30);
        });

        // Weather button clicks
        this.weatherButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (!this.isStarted) return;
                
                const weather = button.dataset.weather;
                this.setWeather(weather);
            });
        });

        // Fullscreen toggle on canvas double-click / double-tap
        this.canvas.addEventListener('dblclick', () => this.toggleFullscreen());

        let lastTap = 0;
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isStarted) return;
            const now = Date.now();
            if (now - lastTap < 300) {
                e.preventDefault();
                this.toggleFullscreen();
            }
            lastTap = now;
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                this.bottomArea.style.opacity = '1';
                this.bottomArea.style.transition = 'opacity 0.3s';
            }
        });
    }

    toggleFullscreen() {
        if (!this.isStarted) return;
        if (!document.fullscreenElement) {
            this.weatherApp.requestFullscreen();
            this.bottomArea.style.opacity = '0';
            this.bottomArea.style.transition = 'opacity 0.3s';
        } else {
            document.exitFullscreen();
        }
    }

    _updateVibrationUI() {
        const label = this.vibrationBtn.querySelector('.vib-label');
        const indicator = this.vibrationBtn.querySelector('.layer-toggle-indicator');
        if (this._vibrationMode === 'legacy') {
            this.vibrationBtn.classList.remove('muted');
            label.textContent = 'Strong';
            indicator.style.background = '#fbbf24';
        } else if (this._vibrationMode === 'modern') {
            this.vibrationBtn.classList.remove('muted');
            label.textContent = 'Vibration';
            indicator.style.background = '';
        } else {
            this.vibrationBtn.classList.add('muted');
            label.textContent = 'Vibration';
            indicator.style.background = '';
        }
    }

    vibrate(duration) {
        if (this._vibrationMode === 'off' || !this._vibrationSupported) return;
        try {
            if (this._vibrationMode === 'legacy') {
                if (Array.isArray(duration)) {
                    navigator.vibrate(duration.map(v => Math.round(v * 3)));
                } else {
                    navigator.vibrate(Math.max(Math.round(duration * 10), 200));
                }
            } else {
                navigator.vibrate(duration);
            }
        } catch (e) {}
    }
    
    setWeather(weather) {
        if (!this.weatherConfig[weather]) {
            return;
        }
        
        this.currentWeather = weather;
        const config = this.weatherConfig[weather];
        
        // Always update UI (even for same weather, needed for initial load)
        this.updateUI(weather);
        
        // Update background
        this.weatherApp.dataset.weather = weather;
        
        // Update weather renderer
        this.renderer.setWeather(weather, config.particles);
        
        // Update audio
        this.audioManager.setWeather(weather);

        this.vibrate(20);

        // Connect thunder sound to lightning for thunder weather
        if (weather === 'thunder') {
            this.renderer.onThunder = () => {
                if (this.audioManager.generateThunder) {
                    this.audioManager.generateThunder();
                }
                this.vibrate([100, 50, 80, 50, 60]);
            };
        } else {
            this.renderer.onThunder = null;
        }

        // Update layer toggles for the new weather
        this.updateLayersPanel();
    }

    updateLayersPanel() {
        const layers = this.audioManager.getLayersForWeather(this.currentWeather);
        this.layersRow.innerHTML = '';

        for (const layer of layers) {
            const toggle = document.createElement('button');
            toggle.className = 'layer-toggle' + (layer.muted ? ' muted' : '');
            toggle.dataset.group = layer.group;
            toggle.dataset.name = layer.name;

            const indicator = document.createElement('span');
            indicator.className = 'layer-toggle-indicator';

            const label = document.createElement('span');
            label.className = 'layer-toggle-label';
            label.textContent = layer.name;

            toggle.appendChild(indicator);
            toggle.appendChild(label);

            toggle.addEventListener('click', () => {
                const isMuted = toggle.classList.contains('muted');
                this.audioManager.muteLayer(layer.group, layer.name, !isMuted);
                toggle.classList.toggle('muted', !isMuted);
                this.vibrate(20);
            });

            this.layersRow.appendChild(toggle);
        }
    }
    
    updateUI(weather) {
        // Update button states
        this.weatherButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.weather === weather);
        });
    }
    
    startAnimation() {
        this._lastFrameTime = 0;
        let frameCount = 0;
        let fpsTimer = 0;

        const animate = (currentTime) => {
            this.animationId = requestAnimationFrame(animate);

            let dt = this._lastFrameTime ? (currentTime - this._lastFrameTime) / 1000 : 0;
            if (dt > 0.1 && !document.hidden) dt = 1 / 60;
            const deltaTime = dt;
            this._lastFrameTime = currentTime;

            if (document.hidden) {
                this.renderer.update(deltaTime);
                this.renderer.draw(this.ctx, deltaTime);
                return;
            }

            frameCount++;
            fpsTimer += deltaTime;
            if (fpsTimer >= 1) {
                const fps = frameCount / fpsTimer;
                frameCount = 0;
                fpsTimer = 0;

                if (this._dprState !== 'settled') {
                    this._fpsSamples.push(fps);
                    if (this._fpsSamples.length >= 5) {
                        const avg = this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length;
                        this._fpsSamples = [];

                        if (this._dprState === 'init') {
                            if (avg >= 55) {
                                this.dpr = Math.min(window.devicePixelRatio || 1, 2);
                                this._applyDpr();
                                this._dprState = 'probing';
                            } else {
                                this._dprState = 'settled';
                            }
                        } else {
                            if (avg < 50) {
                                this.dpr = 1;
                                this._applyDpr();
                            }
                            this._dprState = 'settled';
                        }
                    }
                }

                if (this._dprState === 'settled' && fps < 25 && this.dpr > 1) {
                    this.dpr = 1;
                    this._applyDpr();
                }
            }

            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.update(deltaTime);
            this.renderer.draw(this.ctx, deltaTime);
        };

        this.animationId = requestAnimationFrame(animate);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

