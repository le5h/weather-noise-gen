# Weather Noise Generator

A free, interactive weather noise generator for sleep, relaxation, meditation, and concentration. No ads, no downloads required.

## 🌦️ Features

- **☀️ Sunny** - Warm, gentle hum for cozy vibes
- **🌊 Ocean Waves** - Natural rhythmic waves for meditation
- **💨 Windy** - Soothing air currents for focus
- **🌧️ Rain** - Gentle rainfall for sleep and relaxation
- **⛈️ Thunder** - Deep rumbles for concentration
- **❄️ Snow** - Soft, peaceful snowfall sounds
- **🌫️ Foggy** - Mysterious ash particles for mindfulness

## ✨ Highlights

- **Web Audio API** - Procedurally generated sounds, no external files
- **Canvas Particles** - Smooth 60fps visual effects synchronized with audio
- **Progressive Web App** - Installable on mobile devices with offline support
- **Privacy-First** - No tracking, no data collection
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

1. Open `index.html` in your web browser
2. Click "🎧 Start Making Noise!"
3. Select your preferred weather sound
4. Relax and enjoy

### Local Development
```bash
python -m http.server 8000
# or
npx serve .
```

## 🏗️ Project Structure

```
weather-noise-generator/
├── index.html              # Main application
├── styles.css              # Responsive styling
├── manifest.json           # PWA configuration
├── js/
│   ├── main.js             # Application controller
│   ├── weatherRenderer.js  # Particle systems
│   ├── audioManager.js     # Web Audio API synthesis
│   └── thunderWorker.js    # Web Worker for thunder
└── README.md
```

## 🎯 Core Components

- **WeatherApp** - State management and user interactions
- **WeatherRenderer** - Canvas-based particle systems with physics
- **AudioManager** - Web Audio API sound synthesis with Web Workers

## 🔧 Technical Implementation

- **Modular Audio Graph** - Dynamic construction for each weather type
- **Hardware Acceleration** - GPU-accelerated 2D canvas rendering
- **Object Pooling** - Efficient memory management
- **PWA Features** - Offline capability and mobile installation

## 🌐 Browser Compatibility

- Chrome/Edge - Full support
- Firefox - Full support
- Safari - Full support (iOS audio requires user gesture)
- Mobile - Optimized for iOS Safari and Android Chrome

## � Mobile Installation

1. Open the app in your mobile browser
2. Tap "Share" → "Add to Home Screen"
3. Enjoy app-like experience with offline access

## 🔮 Future Enhancements

- [ ] Additional weather types
- [ ] Custom sound mixing
- [ ] Sleep timer features
- [ ] Smart home integration

## � License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Submit pull requests for:
- New weather sound effects
- Performance optimizations
- UI/UX improvements
- Accessibility enhancements

---

**Transform your environment into a peaceful sanctuary with weather sounds.** 🌧️✨
