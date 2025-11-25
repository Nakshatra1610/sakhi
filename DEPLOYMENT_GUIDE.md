# 🚀 Sakhi - Complete Deployment Guide

This guide will walk you through deploying Sakhi from scratch with all required configurations.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 18+ installed ([Download](https://nodejs.org/))
- ✅ A Google/Gmail account (for Firebase)
- ✅ Your project cloned locally

---

## 🔥 Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `sakhi-app` (or your preferred name)
4. **Disable** Google Analytics (optional, not needed)
5. Click **"Create project"**
6. Wait for project creation (takes ~30 seconds)

### 1.2 Enable Email/Password Authentication

1. In Firebase Console sidebar, click **"Authentication"**
2. Click **"Get started"** button
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"** provider
5. Toggle **"Enable"** to ON
6. Click **"Save"**

✅ **Done!** Users can now sign up with email/password.

### 1.3 Create Firestore Database

1. Click **"Firestore Database"** in sidebar
2. Click **"Create database"** button
3. Select **"Start in production mode"**
4. Choose your location:
   - 🇮🇳 India: `asia-south1` (Mumbai)
   - 🇺🇸 USA: `us-central1`
   - 🇪🇺 Europe: `europe-west1`
5. Click **"Enable"**
6. Wait for database creation (~1 minute)

### 1.4 Set Up Firestore Security Rules

**IMPORTANT:** This step is critical for security!

1. In Firestore Database, click **"Rules"** tab
2. **Delete all existing rules**
3. **Copy and paste** the following rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - only owner can access their data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Safe places - public/system places readable by all
    match /safePlaces/{placeId} {
      allow read: if true; // Anyone can read (including guests)
      allow create: if request.auth != null; // Only authenticated users can create
      allow update, delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || resource.data.category == 'public');
    }
    
    // System places (police stations, hospitals from OSM)
    match /systemPlaces/{placeId} {
      allow read: if true; // Everyone can read
      allow write: if request.auth != null; // Authenticated users can add
    }
    
    // Place helpfulness/reviews
    match /placeHelpfulness/{feedbackId} {
      allow read: if true; // Everyone can see reviews
      allow create: if request.auth != null; // Only logged-in users can review
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Trusted contacts - private to user
    match /contacts/{contactId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // SOS alerts - private to user
    match /sosAlerts/{alertId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Location sharing - owner and shared contacts can view
    match /locationSharing/{shareId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.uid in resource.data.sharedWith);
      allow create, update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Safety checks - private to user
    match /safetyChecks/{checkId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

4. Click **"Publish"** button
5. Confirm by clicking **"Publish"** again

✅ **Security rules are now active!**

### 1.5 Get Firebase Configuration

1. Click **⚙️ (Settings icon)** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. If no app exists, click **Web icon `</>`**
   - Enter nickname: `Sakhi Web App`
   - **DON'T** check Firebase Hosting
   - Click **"Register app"**
4. You'll see **firebaseConfig** object - **COPY IT**

Example config (yours will be different):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "sakhi-app-12345.firebaseapp.com",
  projectId: "sakhi-app-12345",
  storageBucket: "sakhi-app-12345.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXX"
};
```

---

## ⚙️ Step 2: Configure Your Local Project

### 2.1 Update .env File

1. Open `.env` file in your project root
2. Replace the placeholder values with your Firebase config:

```env
# Firebase Configuration - REPLACE WITH YOUR VALUES
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=sakhi-app-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sakhi-app-12345
VITE_FIREBASE_STORAGE_BUCKET=sakhi-app-12345.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXX
```

3. **Save** the file

**IMPORTANT:** Never commit `.env` to GitHub (it's already in `.gitignore`)

### 2.2 Update firebase.ts (Alternative Method)

If you prefer hardcoding (not recommended for public repos):

1. Open `src/lib/firebase.ts`
2. Replace the config object with your values:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

---

## 🧪 Step 3: Test Locally

### 3.1 Install Dependencies

```bash
npm install
# or
bun install
```

### 3.2 Start Development Server

```bash
npm run dev
# or
bun run dev
```

Visit: http://localhost:5173

### 3.3 Test Core Features

#### Test Guest Mode:
1. ✅ Click "Continue as Guest"
2. ✅ View Safe Places
3. ✅ See emergency numbers
4. ✅ Check Safety Tips

#### Test Authentication:
1. ✅ Click "Get Started"
2. ✅ Sign up with email/password
3. ✅ Verify you're redirected to Dashboard
4. ✅ Sign out and sign in again

#### Test Safe Places:
1. ✅ Go to Safe Places page
2. ✅ Allow location access
3. ✅ See nearby police stations & hospitals (from OpenStreetMap)
4. ✅ Add a personal safe place
5. ✅ View it in the list

#### Test SOS:
1. ✅ Add a trusted contact
2. ✅ Go to Emergency SOS
3. ✅ Try activating SOS (cancel before it sends)

---

## 🌐 Step 4: Deploy to Production

### Option A: Deploy to Vercel (Recommended - FREE)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Set Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all `VITE_FIREBASE_*` variables
   - Redeploy: `vercel --prod`

5. **Update Firebase Authorized Domains:**
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add your Vercel domain (e.g., `sakhi-app.vercel.app`)

### Option B: Deploy to Netlify (FREE)

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login:**
```bash
netlify login
```

3. **Deploy:**
```bash
npm run build
netlify deploy --prod
```

4. **Set Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add all `VITE_FIREBASE_*` variables

5. **Update Firebase Authorized Domains:**
   - Add your Netlify domain to Firebase

### Option C: Deploy to Firebase Hosting (FREE)

1. **Install Firebase Tools:**
```bash
npm install -g firebase-tools
```

2. **Login:**
```bash
firebase login
```

3. **Initialize Hosting:**
```bash
firebase init hosting
```
   - Select your Firebase project
   - Build directory: `dist`
   - Single-page app: `Yes`
   - Overwrite index.html: `No`

4. **Build and Deploy:**
```bash
npm run build
firebase deploy
```

5. Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

---

## 🗄️ Step 5: Firestore Collections (Auto-Created)

The following collections will be **automatically created** when users interact with the app:

### Collections Created Automatically:

1. **`safePlaces`** - Created when users add personal/public places
2. **`systemPlaces`** - Created when OpenStreetMap data is cached (optional)
3. **`placeHelpfulness`** - Created when users rate places
4. **`contacts`** - Created when users add trusted contacts
5. **`sosAlerts`** - Created when users trigger SOS
6. **`locationSharing`** - Created when users share location
7. **`safetyChecks`** - Created when users use safety check-in

**You don't need to manually create these!** Just use the app and they'll appear.

---

## 🔒 Step 6: Security Checklist

Before going live, ensure:

- ✅ Firestore security rules are published
- ✅ `.env` file is in `.gitignore` (already done)
- ✅ Firebase API keys are restricted (optional but recommended)
  - Firebase Console → Project Settings → API Keys
  - Restrict by domain/IP
- ✅ Email/Password auth is enabled
- ✅ Authorized domains include your production URL

---

## 🎯 Step 7: Post-Deployment Testing

After deployment, test on production:

1. ✅ Sign up new account
2. ✅ Add trusted contacts
3. ✅ View safe places
4. ✅ Test SOS activation (cancel before sending)
5. ✅ Share location
6. ✅ Check session timeout (10 min)

---

## 🚨 Common Issues & Solutions

### Issue: "Missing or insufficient permissions"
**Solution:** Check Firestore security rules are published correctly

### Issue: "Authentication failed"
**Solution:** Ensure Email/Password provider is enabled in Firebase Console

### Issue: "Firebase config not found"
**Solution:** Verify `.env` file has all required variables

### Issue: No safe places showing
**Solution:** 
- Check browser location permissions
- Verify OpenStreetMap servers are accessible
- Try a different city/location

### Issue: Can't deploy to Vercel/Netlify
**Solution:** 
- Run `npm run build` locally first
- Check for build errors
- Ensure all dependencies are installed

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com/)

---

## 🆘 Need Help?

- **GitHub Issues:** https://github.com/Nakshatra1610/sakhi/issues
- **Firebase Support:** https://firebase.google.com/support
- **Discord Community:** (Add your Discord link if you create one)

---

## ✅ Deployment Checklist

Print this and check off each step:

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Security rules published
- [ ] Firebase config copied
- [ ] `.env` file updated
- [ ] Tested locally
- [ ] Built successfully (`npm run build`)
- [ ] Deployed to hosting platform
- [ ] Environment variables set on hosting
- [ ] Authorized domains added to Firebase
- [ ] Production testing complete

---

**🎉 Congratulations! Sakhi is now live and helping keep women safe!**
