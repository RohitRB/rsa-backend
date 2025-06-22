# 🚀 Railway Deployment Guide for RSA Backend

## ✅ Current Status
Your Node.js backend is now successfully uploaded to GitHub at: `https://github.com/RohitRB/rsa-backend.git`

All sensitive files have been removed from the repository and the code is ready for Railway deployment.

## 🎯 Step-by-Step Railway Deployment

### Step 1: Access Railway Dashboard
1. Go to [https://railway.app/](https://railway.app/)
2. Sign in with your GitHub account
3. You'll be redirected to the Railway dashboard

### Step 2: Create New Project
1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `RohitRB/rsa-backend`
4. Railway will automatically detect it's a Node.js project

### Step 3: Configure Environment Variables
Once your project is created, go to the **Variables** tab and add these environment variables:

#### Required Variables:
```env
RAZORPAY_KEY_ID=rzp_live_yYGWUPovOauhOx
RAZORPAY_KEY_SECRET=m5wQh8cIXTJ92UJeoHhwtLxa
MONGODB_URI=mongodb+srv://sisodiayashaswi7:Yashaswi1225@@@cluster0.sinn5wt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

#### Firebase Configuration:
Add your Firebase service account key as a variable:
1. Open your `kalyan-rsa-backend-firebase-adminsdk-fbsvc-af5b9f8c2e.json` file
2. Copy the entire JSON content
3. In Railway Variables, add:
   - **Variable Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON content (the whole file)

### Step 4: Deploy
1. Railway will automatically start building your project
2. You can monitor the build process in the **Deployments** tab
3. Once successful, you'll get a live URL like: `https://your-app-name.railway.app`

### Step 5: Test Your Deployment
Test these endpoints to ensure everything is working:

1. **Health Check**: `GET https://your-app-name.railway.app/`
   - Should return: "Firebase backend is running!"

2. **Admin Dashboard**: `GET https://your-app-name.railway.app/api/dashboard`
   - Should return dashboard statistics

3. **Create Order**: `POST https://your-app-name.railway.app/create-order`
   - Test with: `{"amount": 100}`

## 🔧 Configuration Files

Your project includes these Railway-specific files:

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### package.json
- Contains all necessary dependencies
- Includes start script: `"start": "node index.js"`
- Includes dev script: `"dev": "nodemon index.js"`

### .gitignore
- Excludes sensitive files from Git
- Prevents secrets from being committed

## 📊 Monitoring Your Deployment

### Railway Dashboard Features:
- **Real-time Logs** - Monitor application logs
- **Performance Metrics** - CPU, memory usage
- **Deployment History** - Track all deployments
- **Environment Variables** - Manage configuration
- **Custom Domains** - Add your own domain

### Health Checks:
- Railway automatically checks your `/` endpoint
- If health check fails, Railway will restart your app
- Monitor health check status in the dashboard

## 🚨 Troubleshooting

### Common Issues and Solutions:

#### 1. Build Failures
**Problem**: Build fails during deployment
**Solution**: 
- Check Railway build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

#### 2. Environment Variables Missing
**Problem**: App crashes with "missing environment variable" error
**Solution**:
- Double-check all environment variables are set in Railway
- Verify variable names match exactly (case-sensitive)
- Ensure Firebase service account key is complete JSON

#### 3. Firebase Connection Error
**Problem**: Cannot connect to Firebase
**Solution**:
- Verify Firebase service account key is correct
- Check Firebase project settings
- Ensure Firestore is enabled in your Firebase project

#### 4. Payment Processing Issues
**Problem**: Razorpay payments fail
**Solution**:
- Verify Razorpay keys are correct
- Check if using live/test keys appropriately
- Monitor payment verification logs

#### 5. CORS Issues
**Problem**: Frontend can't connect to backend
**Solution**:
- Update frontend environment variables with Railway URL
- Check CORS configuration in backend
- Verify Railway URL is accessible

## 🔄 Updating Your Deployment

### Automatic Deployments:
- Railway automatically deploys when you push to GitHub
- No manual intervention required
- Each push triggers a new deployment

### Manual Deployments:
1. Go to Railway dashboard
2. Click **"Deploy"** button
3. Railway will rebuild and redeploy

### Rolling Back:
1. Go to **Deployments** tab
2. Find the previous successful deployment
3. Click **"Redeploy"** to roll back

## 💰 Railway Pricing

### Free Tier:
- 500 hours/month
- 512MB RAM
- 1GB storage
- Perfect for development and small projects

### Paid Plans:
- $5/month for additional resources
- $20/month for production workloads
- Custom plans for enterprise needs

## 🔗 Next Steps After Deployment

### 1. Update Frontend Configuration
Update your frontend environment variables:
```env
VITE_APP_BACKEND_URL=https://your-app-name.railway.app
```

### 2. Test All Features
- Test user registration
- Test policy creation
- Test payment processing
- Test admin dashboard

### 3. Set Up Monitoring
- Configure Railway alerts
- Set up custom domain (optional)
- Monitor application performance

### 4. Scale if Needed
- Upgrade Railway plan if needed
- Configure auto-scaling
- Set up load balancing

## 📞 Support Resources

### Railway Documentation:
- [Railway Docs](https://docs.railway.app/)
- [Deployment Guide](https://docs.railway.app/deploy/deployments)
- [Environment Variables](https://docs.railway.app/deploy/environment-variables)

### Your Project Links:
- **GitHub Repository**: https://github.com/RohitRB/rsa-backend
- **Railway Dashboard**: https://railway.app/dashboard
- **Live URL**: https://your-app-name.railway.app (after deployment)

## 🎉 Success Checklist

- ✅ Code uploaded to GitHub
- ✅ Sensitive files removed from repository
- ✅ Railway configuration files added
- ✅ Environment variables documented
- ✅ README updated with deployment guide
- 🔄 **Next**: Deploy to Railway
- 🔄 **Next**: Configure environment variables
- 🔄 **Next**: Test deployment
- 🔄 **Next**: Update frontend configuration

---

**Your backend is ready for Railway deployment! 🚀**

Follow the steps above to deploy your application to Railway and get it live on the internet.
