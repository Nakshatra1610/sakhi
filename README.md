# 🛡️ Sakhi - Women's Safety Companion

<div align="center">

![Sakhi Banner](https://img.shields.io/badge/Sakhi-Women's%20Safety-ff69b4?style=for-the-badge)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)

**Your trusted safety companion for women's security and emergency assistance**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 About Sakhi

**Sakhi** (meaning "friend" in Hindi) is a comprehensive women's safety web application designed to provide instant access to emergency services, safe locations, and trusted contacts. Built with modern web technologies, Sakhi empowers women with tools to stay safe and connected.

### 🎯 Mission

To create a accessible, free, and reliable safety platform that helps women feel secure wherever they are.

---

## ✨ Features

### 🚨 Emergency Services
- **One-Tap Emergency Calls** - Instant dial to Indian emergency numbers:
  - 🚔 Police: **100**
  - 🚑 Ambulance: **102**
  - 👮‍♀️ Women Helpline: **1091**
  - 🆘 National Emergency: **112**
- **Emergency SOS** - Send distress signals to trusted contacts
- **Silent & Loud Mode** - Discreet or audible emergency alerts

### 🗺️ Safe Places
- **Real-time Location Discovery** - Find nearby police stations and hospitals using OpenStreetMap
- **10km Radius Search** - Comprehensive coverage with reliable 3-server failover
- **Smart Sorting** - Police stations and hospitals prioritized at the top
- **Distance Calculation** - See how far each safe place is from you
- **Verified Locations** - Real data from OpenStreetMap contributors
- **One-Click Directions** - Navigate to any safe place instantly
- **Guest Access** - No login required to view safe places

### 👥 Trusted Contacts
- **Emergency Contacts Management** - Add family, friends, and trusted individuals
- **Automatic Notifications** - Alert contacts during emergencies
- **Contact Priority** - Set primary emergency contact
- **Quick Call Access** - Direct dial to any saved contact

### 📍 Location Sharing
- **Real-time Tracking** - Share your live location with trusted contacts
- **Timed Sharing** - Set duration for location sharing
- **Privacy Controls** - Full control over who sees your location

### 🛡️ Safety Check
- **Periodic Check-ins** - Regular safety status updates
- **Auto-alerts** - Automatic notifications if you miss check-ins
- **Customizable Intervals** - Set your own check-in frequency

### 📚 Safety Tips
- **Educational Resources** - Learn essential safety practices
- **Situation-specific Advice** - Tips for various scenarios
- **Prevention Strategies** - Proactive safety measures

### 🎨 Modern UI/UX
- **Mobile-First Design** - Optimized for phones and tablets
- **Dark Mode Support** - Easy on the eyes, day or night
- **Responsive Layout** - Works perfectly on all screen sizes
- **Smooth Animations** - Polished and professional interface
- **Accessible** - WCAG compliant for all users

### 🔒 Privacy & Security
- **Firebase Authentication** - Secure login with email/password
- **Session Management** - 10-minute auto-logout for security
- **Private Data** - Personal places and contacts are encrypted
- **Guest Mode** - Access basic features without creating an account

---

## 🎥 Demo

### Guest Mode Features
✅ Emergency helpline numbers
✅ Safe places discovery
✅ Safety tips
✅ Emergency calling

### Registered User Features
✅ All guest features
✅ Trusted contacts management
✅ Location sharing
✅ Emergency SOS with auto-notifications
✅ Safety check-ins
✅ Personal safe places

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun runtime
- Firebase account (for authentication)
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/alphabet28/sakhi.git
cd sakhi

# Install dependencies
npm install
# or
bun install

# Set up environment variables (see SETUP.md)
cp .env.example .env

# Start development server
npm run dev
# or
bun run dev
```

Visit `http://localhost:5173` to see the app!

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Lucide Icons** - Modern icon set

### Backend & Services
- **Firebase Auth** - User authentication
- **Firebase Firestore** - Real-time database
- **OpenStreetMap** - Map data provider
- **Overpass API** - Location data queries
- **Leaflet** - Interactive maps

### Maps & Location
- **React Leaflet** - Map integration
- **Overpass API** - Real police & hospital data
- **Geolocation API** - User location detection
- **Haversine Formula** - Distance calculations

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static typing
- **Vite** - Build optimization
- **Git** - Version control

---

## 📁 Project Structure

```
sakhi/
├── public/              # Static assets
│   ├── favicon.ico
│   └── placeholder.svg
├── src/
│   ├── assets/          # Images and media
│   ├── components/      # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── Hero.tsx
│   │   ├── AuthSection.tsx
│   │   └── OpenStreetMap.tsx
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.tsx
│   │   └── SessionContext.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSafePlaces.ts
│   │   ├── useContacts.ts
│   │   └── useSOS.ts
│   ├── lib/             # Utility functions
│   │   ├── firebase.ts
│   │   ├── overpassApi.ts
│   │   ├── safePlaces.ts
│   │   └── auth.ts
│   ├── pages/           # Route pages
│   │   ├── Index.tsx
│   │   ├── Dashboard.tsx
│   │   ├── GuestDashboard.tsx
│   │   ├── SafePlaces.tsx
│   │   ├── EmergencySOS.tsx
│   │   ├── TrustedContacts.tsx
│   │   └── SafetyTips.tsx
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── .env.example         # Environment variables template
├── README.md            # This file
├── SETUP.md             # Detailed setup instructions
└── package.json         # Dependencies
```

---

## 🌟 Key Highlights

### 🆓 100% Free & Open Source
- No subscription fees
- No ads
- No data selling
- Community-driven

### 🌐 Works Offline (Partially)
- Cached safe places
- Saved contacts accessible
- Emergency numbers always available

### 📱 Progressive Web App (PWA) Ready
- Add to home screen
- App-like experience
- Fast loading
- Reliable performance

### 🌍 Indian Emergency Services
- Tailored for Indian users
- Local emergency numbers
- Regional language support (coming soon)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Areas for Contribution
- 🌐 Multi-language support
- 📱 Mobile app (React Native)
- 🔔 Push notifications
- 🗣️ Voice commands
- 🤖 AI-powered safety suggestions
- 📊 Analytics dashboard
- 🧪 Testing coverage

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenStreetMap Contributors** - For providing free, open map data
- **shadcn/ui** - For beautiful, accessible components
- **Firebase** - For reliable backend services
- **Vercel** - For seamless deployment
- **All Contributors** - Thank you for making Sakhi better!

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/alphabet28/sakhi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alphabet28/sakhi/discussions)
- **Email**: support@sakhi.app (if available)

---

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Emergency calling
- [x] Safe places discovery
- [x] Trusted contacts
- [x] Location sharing
- [x] Guest mode

### Phase 2 (Q1 2026)
- [ ] Push notifications
- [ ] Offline mode enhancement
- [ ] Multi-language support
- [ ] Voice commands
- [ ] Share location via SMS

### Phase 3 (Q2 2026)
- [ ] Mobile app (iOS/Android)
- [ ] Community reviews for places
- [ ] Safety routes
- [ ] Integration with local police
- [ ] AI-powered threat detection

---

## 💖 Support the Project

If Sakhi has helped you or someone you know, consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🔀 Contributing code
- 📢 Spreading the word

---

<div align="center">

**Made with ❤️ for women's safety**

[⬆ Back to Top](#-sakhi---womens-safety-companion)

</div>
