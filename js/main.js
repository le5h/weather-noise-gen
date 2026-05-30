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
        this.vibrationBtn = document.getElementById('vibrationBtn');
        
        this.currentWeather = 'snow';
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

        // Set initial vibration icon
        this.vibrationBtn.textContent = this.vibrationEnabled ? '🔇' : '🔕';

        // Show beautiful start screen immediately
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
            this.layersRow.style.display = 'none';
            this.layersRow.innerHTML = '';
            this.settingsBtn.classList.remove('active');
        this.settingsOpen = false;
        this.vibrationEnabled = localStorage.getItem('vibration') !== 'off';
            // Call showStartScreen to ensure floating button appears
            this.showStartScreen();
        }, 50);
    }
    
    startExperience() {
        this.isStarted = true;
        this.vibrate(15);
        
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
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.renderer.resize(this.canvas.width, this.canvas.height);
        };
        
        resize();
        window.addEventListener('resize', resize);
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
            this.layersRow.style.display = this.settingsOpen ? 'flex' : 'none';
            this.settingsBtn.classList.toggle('active', this.settingsOpen);
        });

        // Vibration toggle
        this.vibrationBtn.addEventListener('click', () => {
            this.vibrationEnabled = !this.vibrationEnabled;
            this.vibrationBtn.textContent = this.vibrationEnabled ? '🔇' : '🔕';
            localStorage.setItem('vibration', this.vibrationEnabled ? 'on' : 'off');
        });

        // Volume slider
        this.volumeSlider.addEventListener('input', () => {
            const vol = parseFloat(this.volumeSlider.value);
            this.volValue.textContent = Math.round(vol * 100) + '%';
            this.audioManager.setVolume(vol);
            this.vibrate(5);
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

    vibrate(pattern) {
        if (!this.vibrationEnabled) return;
        if (navigator.vibrate) navigator.vibrate(pattern);
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

        this.vibrate(15);

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
                this.vibrate(10);
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
        let lastTime = 0;
        
        const animate = (currentTime) => {
            // Calculate delta time in seconds
            const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0;
            lastTime = currentTime;
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.renderer.update(deltaTime);
            this.renderer.draw(this.ctx);
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

