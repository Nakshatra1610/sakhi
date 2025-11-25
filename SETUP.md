# 🔧 Setup Guide - Sakhi Development Environment

This guide will help you set up Sakhi on your local machine for development or self-hosting.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
  - Check version: `node --version`
- **npm** v9.0.0 or higher (comes with Node.js)
  - Check version: `npm --version`
- **Git** ([Download](https://git-scm.com/))
  - Check version: `git --version`

### Alternative Runtime (Optional)
- **Bun** v1.0.0 or higher ([Download](https://bun.sh/))
  - Faster alternative to npm/node
  - Check version: `bun --version`

### Required Accounts
- **Firebase Account** (Free) - [Sign up here](https://firebase.google.com/)
- **GitHub Account** (for cloning) - [Sign up here](https://github.com/)

---

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/alphabet28/sakhi.git

# Using SSH (if configured)
git clone git@github.com:alphabet28/sakhi.git

# Navigate to project directory
cd sakhi
```

### 2. Install Dependencies

Choose one of the following:

```bash
# Using npm
npm install

# Using bun (faster)
bun install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

**Note**: The project uses Bun by default (see `bun.lockb`), but npm/yarn/pnpm also work.

---

## 🔥 Firebase Setup

Sakhi requires Firebase for authentication and database. Follow these steps:

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `sakhi` (or any name you prefer)
4. Disable Google Analytics (optional, not needed for this project)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Toggle **"Enable"** switch to ON
5. Click **"Save"**

### Step 3: Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll update rules later)
4. Choose your preferred location (e.g., `us-central1` or `asia-south1` for India)
5. Click **"Enable"**

### Step 4: Update Firestore Security Rules

1. In Firestore, click the **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Safe places - personal are private, public/system are readable by all
    match /safePlaces/{placeId} {
      allow read: if true; // Anyone can read
      allow create: if request.auth != null; // Only authenticated users can create
      allow update, delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || resource.data.category == 'public');
    }
    
    // Contacts - only owner can access
    match /contacts/{contactId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // SOS alerts - only owner can access
    match /sosAlerts/{alertId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Location sharing - only owner and shared contacts can access
    match /locationSharing/{shareId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.uid in resource.data.sharedWith);
      allow create, update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

### Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon in top left)
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** `</>`
4. Enter app nickname: `Sakhi Web App`
5. **DON'T** check "Also set up Firebase Hosting"
6. Click **"Register app"**
7. Copy the `firebaseConfig` object (you'll need this next)

Example config (yours will be different):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBr4nyvYq-i5CYWzD-defnRAhSzAZlBtrs",
  authDomain: "sakhi-5f142.firebaseapp.com",
  projectId: "sakhi-5f142",
  storageBucket: "sakhi-5f142.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 6: Update Firebase Configuration in Code

1. Open `src/lib/firebase.ts` in your code editor
2. Find the `firebaseConfig` object (around line 6-13)
3. Replace it with your config from Step 5:

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // Replace with your API key
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Rest of the file remains the same
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

4. Save the file

---

## 🗺️ OpenStreetMap Setup

**No configuration needed!** 

Sakhi uses free public OpenStreetMap APIs:
- **Tile Server**: OpenStreetMap's default tiles
- **Overpass API**: Three public servers for redundancy
  - `https://overpass.kumi.systems/api/interpreter`
  - `https://overpass.openstreetmap.ru/api/interpreter`
  - `https://overpass-api.de/api/interpreter`

These are completely free and require no API keys!

---

## ▶️ Running the Application

### Development Mode

```bash
# Using npm
npm run dev

# Using bun
bun run dev

# Using yarn
yarn dev
```

The app will start at `http://localhost:5173`

### Production Build

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

---

## 🧪 Testing Your Setup

### 1. Test Guest Mode
1. Open `http://localhost:5173`
2. Click **"Continue as Guest"**
3. Verify:
   - ✅ Can view emergency numbers
   - ✅ Can access Safe Places
   - ✅ Can view Safety Tips

### 2. Test Authentication
1. Click **"Get Started"**
2. Create a new account with email/password
3. Verify:
   - ✅ Can sign up
   - ✅ Can sign in
   - ✅ Dashboard loads correctly

### 3. Test Safe Places
1. Go to **Safe Places** page
2. Allow location access when prompted
3. Verify:
   - ✅ Map displays
   - ✅ Your location shows
   - ✅ Nearby places load (if available in your area)

### 4. Test Emergency Features
1. Go to **Trusted Contacts**
2. Add a test contact
3. Go to **Emergency SOS**
4. Verify:
   - ✅ Can activate SOS
   - ✅ Countdown works
   - ✅ Silent/Loud modes available

---

## 🔒 Environment Variables (Optional)

If you want to hide your Firebase config:

### 1. Create `.env` file

```bash
# In project root
touch .env
```

### 2. Add your Firebase config

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Update `firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 4. Add to `.gitignore`

```bash
echo ".env" >> .gitignore
```

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add all `VITE_*` variables

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Option 3: Firebase Hosting

1. **Install Firebase tools:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and initialize:**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Build and deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## 🐛 Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Firebase authentication not working

**Solutions:**
- ✅ Check Firebase console → Authentication is enabled
- ✅ Verify `firebaseConfig` in `src/lib/firebase.ts` is correct
- ✅ Check browser console for specific error messages
- ✅ Ensure your domain is authorized in Firebase console

### Issue: No safe places appearing

**Possible causes:**
- 🌍 Your area might not have detailed OpenStreetMap data
- 🔍 Try a different location (major cities have better coverage)
- 🌐 Check browser console for Overpass API errors
- 📡 Verify internet connection

### Issue: Maps not loading

**Solutions:**
- ✅ Check browser console for errors
- ✅ Verify Leaflet CSS is loaded (in `index.html`)
- ✅ Try different browser
- ✅ Clear cache and hard reload (Ctrl+Shift+R)

### Issue: Build fails

**Solutions:**
```bash
# Clear cache
rm -rf node_modules .vite dist
npm install
npm run build
```

---

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)

### Community
- [GitHub Issues](https://github.com/alphabet28/sakhi/issues) - Bug reports
- [GitHub Discussions](https://github.com/alphabet28/sakhi/discussions) - Questions
- [OpenStreetMap Forum](https://community.openstreetmap.org/) - Map data help

---

## 🔐 Security Notes

### For Production Deployment:

1. **Never commit `.env` files** to version control
2. **Use Firebase security rules** (provided above)
3. **Enable Firebase App Check** for additional security
4. **Set up CORS properly** in Firebase
5. **Use environment variables** for sensitive data
6. **Regular security audits:**
   ```bash
   npm audit
   npm audit fix
   ```

### Firebase Security Checklist:
- ✅ Firestore rules configured
- ✅ Authentication enabled
- ✅ API keys restricted (in Firebase console → Project Settings → API Keys)
- ✅ App Check enabled (optional but recommended)

---

## 📞 Need Help?

If you encounter issues not covered here:

1. **Check existing issues**: [GitHub Issues](https://github.com/alphabet28/sakhi/issues)
2. **Open a new issue**: Include:
   - Your OS and Node version
   - Error messages (screenshots help!)
   - Steps to reproduce
3. **Ask in discussions**: [GitHub Discussions](https://github.com/alphabet28/sakhi/discussions)

---

## ✅ Setup Checklist

Use this to ensure everything is configured:

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase project created
- [ ] Email/Password authentication enabled in Firebase
- [ ] Firestore database created
- [ ] Firestore security rules updated
- [ ] Firebase config copied to `src/lib/firebase.ts`
- [ ] App runs in development mode (`npm run dev`)
- [ ] Can create account and sign in
- [ ] Safe Places page loads
- [ ] Emergency numbers work
- [ ] (Optional) Environment variables configured
- [ ] (Optional) Deployed to production

---

<div align="center">

**You're all set! Happy coding! 🚀**

Need more help? Check the [main README](README.md) or [open an issue](https://github.com/alphabet28/sakhi/issues).

</div>