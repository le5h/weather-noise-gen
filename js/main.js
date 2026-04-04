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
        this.weatherControls = document.querySelector('.weather-controls');
        
        this.currentWeather = 'snow';
        this.renderer = new WeatherRenderer(this.canvas);
        this.audioManager = new AudioManager();
        this.isStarted = false;
        this.animationId = null;
        
        this.weatherConfig = {
            sunny: {
                name: 'Sunny',
                particles: 50,
                background: 'sunny'
            },
            snow: {
                name: 'Heavy Snow',
                particles: 200,
                background: 'snow'
            },
            windy: {
                name: 'Windy Storm',
                particles: 150,
                background: 'windy'
            },
            rain: {
                name: 'Rain',
                particles: 300,
                background: 'rain'
            },
            thunder: {
                name: 'Thunderstorm',
                particles: 250,
                background: 'thunder'
            },
            foggy: {
                name: 'Foggy Ash',
                particles: 180,
                background: 'foggy'
            },
            ocean: {
                name: 'Ocean Waves',
                particles: 250,
                background: 'ocean'
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        
        // Show beautiful start screen immediately
        this.showStartScreen();
    }
    
    showStartScreen() {
        this.startScreen.style.display = 'flex';
        this.weatherControls.style.display = 'none';
    }
    
    backToStart() {
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
        
        // Reset background to default
        this.weatherApp.dataset.weather = 'snow';
        
        // Show start screen with fade effect
        this.startScreen.style.opacity = '0';
        this.startScreen.style.display = 'flex';
        this.startScreen.style.transition = 'opacity 0.3s ease-in';
        
        setTimeout(() => {
            this.startScreen.style.opacity = '1';
            this.weatherControls.style.display = 'none';
        }, 50);
    }
    
    startExperience() {
        this.isStarted = true;
        
        // Select random weather mode
        const weatherTypes = Object.keys(this.weatherConfig);
        const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        this.currentWeather = randomWeather;
        
        // Update background immediately before fade starts
        this.weatherApp.dataset.weather = this.weatherConfig[this.currentWeather].background;
        
        // Hide start screen with fade effect
        this.startScreen.style.opacity = '0';
        this.startScreen.style.transition = 'opacity 0.5s ease-out';
        
        setTimeout(() => {
            this.startScreen.style.display = 'none';
            this.weatherControls.style.display = 'flex';
            
            // Initialize audio and start weather
            this.audioManager.init();
            
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
        
        // Weather button clicks
        this.weatherButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (!this.isStarted) return;
                
                const weather = button.dataset.weather;
                this.setWeather(weather);
            });
        });
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
        this.weatherApp.dataset.weather = config.background;
        
        // Update weather renderer
        this.renderer.setWeather(weather, config.particles);
        
        // Update audio
        this.audioManager.setWeather(weather);
        
        // Connect thunder sound to lightning for thunder weather
        if (weather === 'thunder') {
            this.renderer.onThunder = () => {
                if (this.audioManager.generateThunder) {
                    this.audioManager.generateThunder();
                }
            };
        } else {
            this.renderer.onThunder = null;
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

