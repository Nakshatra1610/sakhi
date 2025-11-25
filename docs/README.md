# Sakhi - Women's Safety Companion 🛡️

A comprehensive women's safety web application built with modern technologies. Sakhi provides essential safety features including emergency contacts, location sharing, safe places discovery, and real-time assistance tools to help women stay secure.

## ✨ Key Features

### 🔐 **Secure Authentication**
- Firebase Authentication with email/password
- Guest mode for anonymous access
- Protected routes with automatic redirection
- Session timeout security for user protection

### 🗺️ **Real-time Safe Places (NEW!)**
- **Interactive Google Maps**: Real-time map with custom markers
- **Dual View Options**: Switch between list and map views
- **Smart Location Services**: Auto-detection with distance calculations  
- **Place Categories**: Police stations, hospitals, shelters, personal & public places
- **Navigation Integration**: Get directions and call emergency numbers
- **Advanced Search**: Filter by category, search by name/address

### 👤 **User Experience**
- Modern responsive design (desktop & mobile)
- Dark theme interface
- Smooth animations and loading states
- Accessibility-focused design

### 🚨 **Safety Features** (In Development)
- Emergency SOS with quick access
- Trusted contacts management
- Safety tips and educational content
- Location sharing capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Maps API key (for maps functionality)
- Firebase project (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sakhi.git
   cd sakhi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Add your Google Maps API key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Get Google Maps API Key** (Required for Maps)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project
   - Enable: Maps JavaScript API, Places API, Distance Matrix API
   - Create credentials → API Key
   - Add the key to your `.env` file

5. **Firebase Setup** (Already configured)
   - Project uses an existing Firebase configuration
   - Authentication works out of the box

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Open Application**
   - Navigate to `http://localhost:8080` (or the port shown)
   - Create an account or use "Continue as Guest"

## 📋 Usage

### For New Users
1. **Sign Up**: Create account with name, email, phone, and password
2. **Explore**: Use guest mode to preview features before registering
3. **Safe Places**: Add and discover safe locations with real-time maps
4. **Dashboard**: Access all safety features from the main dashboard

### For Developers
- **Maps Integration**: See `MAPS_SETUP.md` for detailed Google Maps setup
- **Component Library**: Built with shadcn/ui components  
- **State Management**: React Context for authentication and session
- **Routing**: React Router with protected routes
- **Maps Services**: Custom hooks for Google Maps and geolocation

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore (planned)
- **Maps**: Google Maps JavaScript API
- **Build Tool**: Vite for fast development and builds

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui component library
│   ├── SafePlacesMap.tsx    # Google Maps integration
│   └── ...             # Other components
├── contexts/           # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   └── SessionContext.tsx   # Session management
├── hooks/              # Custom React hooks
│   ├── useAuth.ts          # Authentication hook
│   ├── useGeolocation.ts   # Location services
│   └── useGoogleMaps.ts    # Maps integration
├── pages/              # Page components
│   ├── Index.tsx           # Landing/Auth page
│   ├── Dashboard.tsx       # Main dashboard
│   ├── SafePlaces.tsx      # Safe places with maps
│   └── ...             # Other pages
├── lib/                # Utility libraries
└── utils/              # Helper functions
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Key Development Notes
- **Authentication**: Handled via Firebase Auth context
- **Maps API**: Graceful fallback when no API key provided
- **Responsive**: Mobile-first design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## 🌟 Recent Updates

### Maps Integration (Latest) - v2.0
- **✅ Migrated to AdvancedMarkerElement**: Updated from deprecated `google.maps.Marker` API
- **✅ Enhanced Error Handling**: Better fallback UI for API key issues
- **✅ Custom Marker Design**: HTML-based markers with modern styling
- Added interactive Google Maps to Safe Places
- Real-time user location detection
- Distance calculation to safe places
- Custom markers with info windows
- List/Map view toggle
- Responsive map component
- See `GOOGLE_MAPS_MIGRATION.md` for technical details

### Session Security
- Automatic session timeout after inactivity
- Warning dialogs before logout
- Session extension capabilities

## 🛣️ Roadmap

### Phase 1: Core Safety Features ⏳
- [ ] Emergency SOS functionality
- [ ] Trusted contacts management
- [ ] Real-time location sharing
- [ ] Safety tips and resources

### Phase 2: Advanced Features
- [ ] Geofencing and safety zones
- [ ] Community safety reports
- [ ] Push notifications
- [ ] Offline functionality

### Phase 3: AI & ML Enhancement
- [ ] Predictive safety recommendations
- [ ] Route safety analysis
- [ ] Behavior pattern recognition

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Firebase** for authentication and backend services
- **Google Maps** for location services
- **React community** for the amazing ecosystem

## 📞 Support

For questions, issues, or suggestions:
- 📧 Create an issue in this repository
- 📱 Reach out to the development team

---

**Sakhi** - Empowering women's safety through technology 🌟

*Built with ❤️ for women's safety and security*
