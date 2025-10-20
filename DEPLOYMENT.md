# 🚀 Deployment Guide - Render.com

This guide will help you deploy the Invoice Chain backend to Render.com.

## 📋 Prerequisites

- [x] GitHub account
- [x] Render.com account (free) - Sign up at https://render.com
- [x] Your code pushed to GitHub repository
- [x] MongoDB Atlas database (already configured in your `.env`)
- [x] All API keys from your `.env` file ready

---

## 🎯 Step-by-Step Deployment

### **Step 1: Prepare Your Repository**

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify `.gitignore` excludes sensitive files:**
   Your `.gitignore` should include:
   ```
   .env
   server/.env
   node_modules/
   config/serviceAccountKey.json
   ```

### **Step 2: Create Render Account**

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

### **Step 3: Create New Web Service**

1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `phoneix116/BlockChain-Project`
3. Configure the service:

   **Basic Settings:**
   - **Name:** `invoicechain-backend` (or your preferred name)
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** Leave blank (we specify in commands)
   - **Runtime:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`

   **Instance Type:**
   - Select **"Free"** for testing (or paid tier for production)

### **Step 4: Add Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"** and add these:

#### Required Variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3001` | Or Render's default |
| `LOG_LEVEL` | `info` | |
| `MONGODB_URI` | `your-mongodb-connection-string` | Copy from `.env` |
| `SEPOLIA_RPC_URL` | `your-infura-url` | Copy from `.env` |
| `PRIVATE_KEY` | `your-private-key` | Copy from `.env` |
| `CONTRACT_ADDRESS` | `your-contract-address` | Copy from `.env` |
| `PINATA_JWT` | `your-pinata-jwt` | Copy from `.env` |
| `PINATA_API_KEY` | `your-pinata-api-key` | Copy from `.env` |
| `PINATA_SECRET_KEY` | `your-pinata-secret` | Copy from `.env` |
| `PINATA_DISABLED` | `false` | |
| `IPFS_GATEWAY` | `your-ipfs-gateway-url` | Copy from `.env` |
| `FIREBASE_PROJECT_ID` | `invochain-28e22` | Copy from `.env` |
| `FIREBASE_CLIENT_EMAIL` | `your-firebase-email` | Copy from `.env` |
| `FIREBASE_PRIVATE_KEY` | `your-firebase-private-key` | Copy from `.env` - Keep newlines as `\n` |
| `FIREBASE_ADMIN_ENABLED` | `true` | |
| `OPENAI_API_KEY` | `your-openai-key` | Optional - if using AI features |
| `OPENAI_MODEL` | `gpt-4o-mini` | |
| `EMAIL_PROVIDER` | `mailgun` | |
| `MAILGUN_API_KEY` | `your-mailgun-key` | Copy from `.env` |
| `MAILGUN_DOMAIN` | `mg.invochain.app` | Copy from `.env` |
| `MAILGUN_BASE_URL` | `https://api.mailgun.net` | |
| `MAILGUN_FROM` | `Invoice Chain <no-reply@mg.invochain.app>` | Copy from `.env` |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend-url.vercel.app` | Update when you deploy frontend |
| `CLIENT_URL` | `https://your-frontend-url.vercel.app` | Update when you deploy frontend |

**⚠️ Important Notes:**
- For `FIREBASE_PRIVATE_KEY`, keep the `\n` characters as is (don't convert to actual newlines)
- Double-check all keys are copied correctly
- Never share these values publicly

### **Step 5: Deploy**

1. Click **"Create Web Service"**
2. Render will start building your application
3. Watch the deployment logs in real-time
4. Wait for "Your service is live 🎉" message

### **Step 6: Verify Deployment**

Once deployed, you'll get a URL like: `https://invoicechain-backend.onrender.com`

Test your endpoints:

```bash
# Health check
curl https://invoicechain-backend.onrender.com/health

# API root
curl https://invoicechain-backend.onrender.com/

# Test specific endpoint (if applicable)
curl https://invoicechain-backend.onrender.com/api/contract/info
```

---

## 🔧 Post-Deployment Configuration

### Update Frontend Configuration

After deploying backend, update your frontend to use the new API URL:

**In `client/.env` or `client/.env.production`:**
```env
REACT_APP_API_URL=https://invoicechain-backend.onrender.com
```

### Update CORS Origins

1. Go to Render Dashboard → Your Service → Environment
2. Update `CORS_ALLOWED_ORIGINS` with your actual frontend URL
3. Save changes (this will redeploy)

---

## 📊 Monitoring & Logs

### View Logs:
- Go to Render Dashboard → Your Service → **Logs**
- Real-time logs show all server activity
- Filter by date/time for debugging

### Monitor Health:
- **Metrics tab** shows CPU, memory usage
- **Events tab** shows deployment history
- Set up **alerts** for downtime

---

## 🔄 Auto-Deploy Setup

Render automatically deploys when you push to your `main` branch:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Render will automatically detect and deploy!
```

To disable auto-deploy:
- Dashboard → Service → Settings → **Build & Deploy**
- Toggle "Auto-Deploy" off

---

## ⚡ Free Tier Limitations

**Render Free Tier:**
- ✅ 750 hours/month free
- ✅ Auto-sleep after 15 min inactivity
- ✅ Wakes up on request (may take 30-60s)
- ❌ No custom domains on free tier
- ❌ Slower than paid tiers

**For Production:**
- Upgrade to **Starter** ($7/mo) or **Standard** ($25/mo)
- No sleep, faster performance, custom domains

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs for errors
- Ensure `package.json` is correct
- Verify build command: `cd server && npm install`

### App Crashes on Start
- Check application logs
- Verify environment variables are set
- Ensure `PORT` is set correctly (Render provides this automatically)

### Database Connection Fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for Render)
- Ensure database user has correct permissions

### CORS Errors
- Update `CORS_ALLOWED_ORIGINS` in environment variables
- Include your frontend URL
- Restart the service after changes

### Environment Variables Not Working
- Check spelling and casing (case-sensitive)
- No spaces around `=` in values
- For multi-line values (Firebase key), use `\n` not actual newlines
- Save and redeploy after changes

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore` ✓
2. **Rotate keys regularly** - Especially blockchain private keys
3. **Use separate keys** for development vs production
4. **Enable 2FA** on Render account
5. **Monitor logs** for suspicious activity
6. **Limit MongoDB IP access** when possible

---

## 📱 Useful Commands

```bash
# Force redeploy (if needed)
# Go to Dashboard → Manual Deploy → "Clear build cache & deploy"

# View real-time logs
# Dashboard → Logs tab

# Rollback deployment
# Dashboard → Events → Click previous deployment → "Rollback to this version"
```

---

## 🎉 Next Steps

1. ✅ Backend deployed
2. 🔜 Deploy frontend to Vercel/Netlify
3. 🔜 Update frontend API URL to point to Render backend
4. 🔜 Test end-to-end functionality
5. 🔜 Set up custom domain (optional)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Render Community](https://community.render.com/)

---

## 💡 Tips

- **Cold Starts:** Free tier apps sleep after 15 min. First request takes 30-60s to wake up.
- **Keep Alive:** Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your API every 5 minutes
- **Logs:** Check logs frequently during initial deployment
- **Environment Variables:** Changes trigger automatic redeployment

---

**Your backend URL will be:**
```
https://invoicechain-backend.onrender.com
```

**Replace in frontend:**
```javascript
// client/src/services/*.js
const API_URL = 'https://invoicechain-backend.onrender.com/api';
```

---

Good luck with your deployment! 🚀
