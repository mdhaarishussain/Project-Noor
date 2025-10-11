# 🔒 Production Solution: Setup api.bondhu.tech with SSL

## Overview
Set up a proper subdomain with SSL certificate for your backend API.

```
https://bondhu.tech          → Frontend (Vercel)
https://api.bondhu.tech      → Backend (Azure VM with SSL)
```

---

## Prerequisites
- You have domain: `bondhu.tech`
- Access to domain DNS settings
- Azure VM running (57.159.29.168)

---

## Step 1: Add DNS Record for Subdomain

### Go to your domain registrar (where you bought bondhu.tech)

Add an **A Record**:
```
Type:  A
Name:  api
Value: 57.159.29.168
TTL:   300 (or automatic)
```

This creates: `api.bondhu.tech` → `57.159.29.168`

**Wait 5-10 minutes** for DNS to propagate.

**Test DNS:**
```powershell
# From PowerShell
nslookup api.bondhu.tech

# Should return: 57.159.29.168
```

---

## Step 2: Install Nginx and Certbot on Azure VM

```bash
# SSH into VM
ssh Bondhu_backend@57.159.29.168

# Update system
sudo apt update
sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot (for free SSL)
sudo apt install certbot python3-certbot-nginx -y

# Verify installations
nginx -v
certbot --version
```

---

## Step 3: Configure Nginx as Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/bondhu-api

# Paste this configuration:
server {
    listen 80;
    server_name api.bondhu.tech;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy to Docker backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Save: Ctrl+X, Y, Enter

# Enable the site
sudo ln -s /etc/nginx/sites-available/bondhu-api /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 4: Get Free SSL Certificate from Let's Encrypt

```bash
# Run Certbot
sudo certbot --nginx -d api.bondhu.tech

# Follow prompts:
# 1. Enter email address
# 2. Agree to terms (Y)
# 3. Share email? (N or Y, your choice)
# 4. Redirect HTTP to HTTPS? Choose: 2 (Redirect)

# Certbot will automatically:
# - Get SSL certificate
# - Update Nginx config
# - Enable HTTPS

# Verify certificate
sudo certbot certificates
```

**Expected output:**
```
Certificate Name: api.bondhu.tech
  Domains: api.bondhu.tech
  Expiry Date: 2026-01-09 (VALID: 89 days)
```

---

## Step 5: Test HTTPS Access

```powershell
# From PowerShell
curl https://api.bondhu.tech/health

# Expected: {"status":"healthy"}
```

---

## Step 6: Update Backend .env

```bash
# On Azure VM
cd ~/Project-Noor/bondhu-ai
nano .env

# Update these lines:
GOOGLE_REDIRECT_URI=https://api.bondhu.tech/api/v1/auth/youtube/callback
SPOTIFY_REDIRECT_URI=https://api.bondhu.tech/api/v1/agents/music/callback
CORS_ORIGINS=https://bondhu.tech,https://*.vercel.app,http://localhost:3000

# Save and restart
docker-compose restart bondhu-api
```

---

## Step 7: Update Vercel Environment Variables

```
1. Go to: https://vercel.com/dashboard
2. Your project → Settings → Environment Variables
3. Update: NEXT_PUBLIC_API_URL
   
   Old: http://57.159.29.168:8000
   New: https://api.bondhu.tech

4. Save
5. Deployments → Redeploy
```

---

## Step 8: Update OAuth Providers

### Spotify Developer Dashboard
```
1. Go to: https://developer.spotify.com/dashboard
2. Your app → Edit Settings
3. Redirect URIs → Add:
   https://api.bondhu.tech/api/v1/agents/music/callback

4. Save
```

### Google Cloud Console
```
1. Go to: https://console.cloud.google.com
2. APIs & Services → Credentials
3. OAuth 2.0 Client → Edit
4. Authorized redirect URIs → Update:
   
   Change: http://57.159.29.168:8000/api/v1/auth/youtube/callback
   To:     https://api.bondhu.tech/api/v1/auth/youtube/callback

5. Save
```

### Supabase (no change needed)
```
Already uses: https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback
```

---

## Step 9: Update Azure NSG Rules

```
1. Azure Portal → VM → Networking
2. Add inbound port rule:
   - Priority: 999
   - Name: AllowHTTPS
   - Port: 443
   - Protocol: TCP
   - Action: Allow

3. Keep port 8000 rule (for Docker internal communication)
4. Save
```

---

## Step 10: Setup Auto-Renewal for SSL

```bash
# SSL certificates expire in 90 days
# Certbot auto-renewal is already configured

# Test auto-renewal
sudo certbot renew --dry-run

# If successful, you'll see:
# Congratulations, all simulated renewals succeeded
```

---

## 🎯 Final Configuration Summary

### Your New URLs:
```
Frontend:     https://bondhu.tech
Backend API:  https://api.bondhu.tech
API Docs:     https://api.bondhu.tech/docs
Database:     https://eilvtjkqmvmhkfzocrzs.supabase.co
```

### Updated Environment Variables:

**Vercel:**
```bash
NEXT_PUBLIC_API_URL=https://api.bondhu.tech
```

**Backend .env:**
```bash
GOOGLE_REDIRECT_URI=https://api.bondhu.tech/api/v1/auth/youtube/callback
SPOTIFY_REDIRECT_URI=https://api.bondhu.tech/api/v1/agents/music/callback
CORS_ORIGINS=https://bondhu.tech,https://*.vercel.app,http://localhost:3000
```

---

## ✅ Benefits

- ✅ **Proper HTTPS** with valid SSL certificate
- ✅ **Professional subdomain** (api.bondhu.tech)
- ✅ **Free SSL** from Let's Encrypt
- ✅ **Auto-renewal** (no manual work)
- ✅ **Works with all OAuth providers** (Spotify, Google, etc.)
- ✅ **No browser warnings** about mixed content
- ✅ **Production-ready**

---

## 🧪 Testing

```bash
# Test HTTPS access
curl https://api.bondhu.tech/health

# Test API docs
# Open: https://api.bondhu.tech/docs

# Test from frontend
# Open: https://bondhu.tech
# Check console for HTTPS requests
```

---

## 📝 Maintenance

### Check SSL Certificate Status
```bash
sudo certbot certificates
```

### Renew Manually (if needed)
```bash
sudo certbot renew
sudo systemctl restart nginx
```

### Check Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🚨 Troubleshooting

### Issue: DNS not resolving
```powershell
nslookup api.bondhu.tech
# Wait 10-15 minutes after adding DNS record
```

### Issue: Certbot fails
```bash
# Check if port 80 is open
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Try again
sudo certbot --nginx -d api.bondhu.tech
```

### Issue: 502 Bad Gateway
```bash
# Check if Docker is running
docker-compose ps

# Check Nginx config
sudo nginx -t

# Restart both
docker-compose restart
sudo systemctl restart nginx
```

---

## 🎉 Done!

Your backend now has:
- ✅ HTTPS with valid SSL certificate
- ✅ Professional subdomain
- ✅ Works with Spotify OAuth
- ✅ Production-ready setup

**Next:** Update all your documentation with the new URLs!
