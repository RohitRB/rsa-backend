# RSA Insurance Backend API

A Node.js backend API for RSA Insurance Management System with Firebase Firestore integration and Razorpay payment processing.

## 🚀 Features

- **Firebase Firestore Integration** - Customer and policy data management
- **Razorpay Payment Processing** - Secure payment gateway integration
- **RESTful API Endpoints** - Complete CRUD operations
- **Admin Dashboard** - Policy and customer management
- **Payment Verification** - Secure payment signature verification
- **Email Integration Ready** - Prepared for email notifications
- **PDF Generation Ready** - Prepared for policy document generation

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Firebase Admin SDK** - Database and authentication
- **Razorpay** - Payment gateway
- **MongoDB** - Database (optional)
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore
- Razorpay account
- Railway account (for deployment)

## 🔧 Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/RohitRB/rsa-backend.git
cd rsa-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# MongoDB Configuration (optional)
MONGODB_URI=your_mongodb_connection_string

# Firebase Configuration
# Add your Firebase service account key as environment variable
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 4. Firebase Setup
For local development, place your Firebase service account JSON file in the root directory as `kalyan-rsa-backend-firebase-adminsdk-fbsvc-af5b9f8c2e.json`

### 5. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 🚀 Railway Deployment

### 1. Connect to Railway
1. Go to [Railway.app](https://railway.app/)
2. Sign in with your GitHub account
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose this repository

### 2. Configure Environment Variables
In Railway dashboard, go to your project → **Variables** tab and add:

**Required Variables:**
```env
RAZORPAY_KEY_ID=rzp_live_yYGWUPovOauhOx
RAZORPAY_KEY_SECRET=m5wQh8cIXTJ92UJeoHhwtLxa
MONGODB_URI=mongodb+srv://sisodiayashaswi7:Yashaswi1225@@@cluster0.sinn5wt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**Firebase Configuration:**
Add your Firebase service account key as `FIREBASE_SERVICE_ACCOUNT_KEY` variable (the entire JSON content).

### 3. Deploy
Railway will automatically build and deploy your application. You'll get a live URL like: `https://your-app-name.railway.app`

## 📡 API Endpoints

### Health Check
- `GET /` - Server health check

### Payment Processing
- `POST /create-order` - Create Razorpay order
- `POST /api/payments/verify-and-save` - Verify payment and save policy/customer

### Admin Dashboard
- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/customers` - Get all customers
- `GET /api/policies` - Get all policies

### Customer Management
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Policy Management
- `GET /api/policies` - Get all policies
- `POST /api/policies` - Create new policy
- `GET /api/policies/:id` - Get policy by ID
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

## 🔒 Security

- All sensitive data is stored as environment variables
- Payment signatures are verified using HMAC SHA256
- CORS is configured for secure cross-origin requests
- Firebase security rules protect database access

## 📊 Monitoring

Railway provides:
- Real-time logs
- Performance metrics
- Automatic scaling
- Health checks
- Custom domains

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   - Ensure all required environment variables are set in Railway
   - Check variable names match exactly

2. **Firebase Connection Error**
   - Verify Firebase service account key is correct
   - Check Firebase project settings

3. **Payment Verification Fails**
   - Ensure Razorpay keys are correct
   - Check payment signature verification logic

4. **Build Failures**
   - Check Railway build logs
   - Verify all dependencies are in package.json

## 📞 Support

For issues and questions:
1. Check Railway deployment logs
2. Verify environment variables
3. Test endpoints locally first
4. Review Firebase and Razorpay documentation

## 📄 License

This project is licensed under the ISC License.

---

**Happy Deploying! 🚀**

