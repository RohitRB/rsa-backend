# Local Development Guide for RSA Insurance System

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

## 📁 Project Structure
```
xampp/htdocs/
├── rsa-frontend-review/     # React Frontend
└── rsa-review/             # Node.js Backend
```

## 🔧 Backend Setup (rsa-review)

### 1. Navigate to Backend Directory
```bash
cd rsa-review
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
The backend is now configured to automatically use the Firebase service account JSON file (`kalyan-rsa-backend-firebase-adminsdk-fbsvc-af5b9f8c2e.json`) for local development.

For production, you can set the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable.

### 4. Start Backend Server
```bash
npm run dev
```

The backend will start on `http://localhost:5000`

### 5. Test Backend
Visit `http://localhost:5000` - you should see "Firebase backend is running!"

## 🎨 Frontend Setup (rsa-frontend-review)

### 1. Navigate to Frontend Directory
```bash
cd rsa-frontend-review
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the frontend directory with:

```env
# Backend API URL (for local development)
VITE_APP_BACKEND_URL=http://localhost:5000

# Firebase Configuration (stringified JSON)
VITE_APP_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"kalyan-rsa-backend.firebaseapp.com","projectId":"kalyan-rsa-backend","storageBucket":"kalyan-rsa-backend.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}

# Razorpay Configuration
VITE_APP_RAZORPAY_KEY_ID=rzp_live_yYGWUPovOauhOx

# EmailJS Configuration
VITE_APP_EMAILJS_USER_ID=your_emailjs_user_id
```

### 4. Start Frontend Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🌐 Running Both Projects

### Option 1: Separate Terminals
1. **Terminal 1 (Backend):**
   ```bash
   cd rsa-review
   npm run dev
   ```

2. **Terminal 2 (Frontend):**
   ```bash
   cd rsa-frontend-review
   npm run dev
   ```

### Option 2: Concurrently (Recommended)
Install concurrently in the root directory:

```bash
npm install -g concurrently
```

Then run both projects:
```bash
concurrently "cd rsa-review && npm run dev" "cd rsa-frontend-review && npm run dev"
```

## 🔍 Testing the Application

### 1. Frontend
- Visit `http://localhost:5173`
- Test user registration
- Test policy selection
- Test payment flow

### 2. Backend API Endpoints
- `GET http://localhost:5000/` - Health check
- `POST http://localhost:5000/create-order` - Create Razorpay order
- `POST http://localhost:5000/api/payments/verify-and-save` - Verify payment and save data
- `GET http://localhost:5000/api/customers` - Get customers
- `GET http://localhost:5000/api/policies` - Get policies

## 🛠️ Troubleshooting

### Backend Issues

1. **Firebase Connection Error:**
   - Ensure the Firebase service account JSON file exists
   - Check Firebase project settings
   - Verify the JSON file is valid

2. **Port Already in Use:**
   ```bash
   # Kill process on port 5000
   npx kill-port 5000
   ```

3. **Module Not Found:**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### Frontend Issues

1. **Backend Connection Error:**
   - Ensure backend is running on port 5000
   - Check `VITE_APP_BACKEND_URL` in environment variables
   - Verify CORS settings in backend

2. **Build Errors:**
   ```bash
   # Clear cache and reinstall
   npm run build --force
   ```

## 📊 Available Scripts

### Backend (rsa-review)
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Frontend (rsa-frontend-review)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔒 Security Notes

1. **Never commit sensitive files:**
   - `.env` files
   - Firebase service account keys
   - API keys

2. **Use environment variables for production:**
   - Set `FIREBASE_SERVICE_ACCOUNT_KEY` for production
   - Use production Razorpay keys
   - Configure proper CORS settings

## 🚀 Next Steps

After local development is working:

1. **Deploy Backend to Railway/Render:**
   - Push backend code to GitHub
   - Deploy to Railway or Render
   - Set environment variables

2. **Deploy Frontend to Vercel:**
   - Update `VITE_APP_BACKEND_URL` to production URL
   - Deploy to Vercel
   - Configure environment variables

3. **Test Production:**
   - Test all features in production
   - Verify payment processing
   - Check email notifications

## 📞 Support

If you encounter issues:

1. Check the console logs for both frontend and backend
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check Firebase project settings and rules

---

**Happy Coding! 🎉** 