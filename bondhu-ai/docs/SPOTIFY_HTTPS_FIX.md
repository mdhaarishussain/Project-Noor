# 🚀 Quick Fix: Spotify OAuth with Ngrok

## Problem
Spotify requires HTTPS redirect URIs, but your Azure VM only has HTTP (port 8000).

## Solution: Use Ngrok (Temporary HTTPS Tunnel)

### Step 1: Install Ngrok on Azure VM

```bash
# SSH into your VM
ssh Bondhu_backend@57.159.29.168

# Download ngrok
cd ~
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Verify installation
ngrok version
```

### Step 2: Get Ngrok Auth Token

```
1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (free account)
3. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken
```

### Step 3: Configure Ngrok

```bash
# Still on your Azure VM
ngrok config add-authtoken <YOUR_AUTHTOKEN>

# Example:
# ngrok config add-authtoken 2abc123def456ghi789jkl
```

### Step 4: Start Ngrok Tunnel

```bash
# Create a tunnel to your backend
ngrok http 8000

# You'll see output like:
# Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Step 5: Update Backend .env

```bash
# Open another SSH session
ssh Bondhu_backend@57.159.29.168
cd ~/Project-Noor/bondhu-ai
nano .env

# Update Spotify redirect URI with ngrok URL:
SPOTIFY_REDIRECT_URI=https://abc123.ngrok-free.app/api/v1/agents/music/callback

# Keep Google as is (it allows HTTP):
GOOGLE_REDIRECT_URI=http://57.159.29.168:8000/api/v1/auth/youtube/callback

# Save and restart
docker-compose restart bondhu-api
```

### Step 6: Update Spotify Dashboard

```
1. Go to: https://developer.spotify.com/dashboard
2. Open your app
3. Click: Edit Settings
4. Under Redirect URIs, add:
   https://abc123.ngrok-free.app/api/v1/agents/music/callback

5. Click: Save
```

### Step 7: Keep Ngrok Running

```bash
# Run ngrok in background (recommended)
nohup ngrok http 8000 > ngrok.log 2>&1 &

# Check ngrok URL anytime:
curl http://localhost:4040/api/tunnels
```

## ⚠️ Limitations of Ngrok Free

- **URL changes on restart** (must update Spotify every time)
- **Limited to 20,000 requests/month**
- **2 hour session limit** (tunnels expire)
- Not suitable for production

## ✅ Pros
- ✅ Works immediately
- ✅ Free
- ✅ HTTPS enabled
- ✅ No DNS configuration needed

## ❌ Cons
- ❌ URL changes frequently
- ❌ Not reliable for production
- ❌ Session limits

---

## Better Solution: Setup Custom Domain

See next section for permanent fix.
