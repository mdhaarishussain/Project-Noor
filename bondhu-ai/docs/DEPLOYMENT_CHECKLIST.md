# ✅ Production Deployment Checklist# ✅ Production Deployment Checklist - Vercel + Azure# ✅ Conversational Memory System - Deployment Checklist



## 🎯 Your Production URLs



```## 🎯 Quick Reference - Fill These In First!**Date**: October 7, 2025  

┌─────────────────────────────────────────────────────────────┐

│                                                             │**Status**: Ready for Deployment  

│  FRONTEND: https://bondhu.tech                              │

│                                                             │```**Estimated Setup Time**: 15 minutes

│  BACKEND:  http://57.159.29.168:8000                       │

│                                                             │┌─────────────────────────────────────────────────────────────┐

└─────────────────────────────────────────────────────────────┘

```│ YOUR PRODUCTION URLS                                        │---



---├─────────────────────────────────────────────────────────────┤



## 📋 Configuration Steps (In Order)│                                                             │## 📋 PRE-DEPLOYMENT CHECKLIST



### ⚙️ STEP 1: Backend (Azure VM) Configuration│ FRONTEND (Vercel):                                          │



**Time: 5 minutes | SSH Required**│ https://______________________.vercel.app                   │### Files Verification



```bash│                                                             │

# SSH into your VM

ssh Bondhu_backend@57.159.29.168│ BACKEND (Azure VM):                                         │- [x] **Core Memory Modules Created**

cd ~/Project-Noor/bondhu-ai

```│ http://___.___.___.___ :8000                               │  - [x] `bondhu-ai/core/memory/__init__.py`



#### 1.1: Update `.env` File│                                                             │  - [x] `bondhu-ai/core/memory/conversation_memory.py`

- [ ] Edit configuration file:

  ```bash│ CUSTOM DOMAIN (optional):                                   │  - [x] `bondhu-ai/core/memory/memory_index.py`

  nano .env

  ```│ https://________________________                            │  - [x] `bondhu-ai/core/memory/memory_retriever.py`



- [ ] Update these 3 lines:│                                                             │

  ```bash

  GOOGLE_REDIRECT_URI=http://57.159.29.168:8000/api/v1/auth/youtube/callback└─────────────────────────────────────────────────────────────┘- [x] **API & Tasks Created**

  SPOTIFY_REDIRECT_URI=http://57.159.29.168:8000/api/v1/agents/music/callback

  CORS_ORIGINS=https://bondhu.tech,https://*.vercel.app,http://localhost:3000```  - [x] `bondhu-ai/api/routes/memory.py`

  ```

  - [x] `bondhu-ai/core/tasks/memory_tasks.py`

- [ ] Save file (Ctrl+X, Y, Enter)

---

#### 1.2: Restart Docker Containers

- [ ] Run restart commands:- [x] **Database Schema Created**

  ```bash

  docker-compose down## 📋 Configuration Steps (In Order)  - [x] `bondhu-ai/database/conversational_memory_schema.sql`

  docker-compose up -d

  ```



- [ ] Verify all containers running:### ⚙️ STEP 1: Backend (Azure VM) Configuration- [x] **Integration Updated**

  ```bash

  docker-compose ps  - [x] `bondhu-ai/api/routes/chat.py` (memory integration)

  # Expected: All show "Up (healthy)"

  ```**Time: 5 minutes | SSH Required**  - [x] `bondhu-ai/main.py` (memory router added)



#### 1.3: Test Backend Locally (from VM)

- [ ] Health check:

  ```bash```bash- [x] **Documentation Created**

  curl http://localhost:8000/health

  # Expected: {"status":"healthy"}# SSH into your VM  - [x] `CONVERSATIONAL_MEMORY_COMPLETE_GUIDE.md`

  ```

ssh Bondhu_backend@<your-vm-ip>  - [x] `MEMORY_SYSTEM_QUICK_SETUP.md`

#### 1.4: Open Port 8000 in Azure NSG

- [ ] Navigate to:cd ~/Project-Noor/bondhu-ai  - [x] `MEMORY_SYSTEM_VISUAL_ARCHITECTURE.md`

  ```

  Azure Portal → Virtual Machines → Your VM```  - [x] `MEMORY_SYSTEM_IMPLEMENTATION_COMPLETE.md`

  → Networking → Network Settings

  → Add inbound port rule  - [x] This checklist file

  ```

#### 1.1: Update `.env` File

- [ ] Configure rule:

  ```- [ ] Edit configuration file:---

  Priority: 1000

  Name: AllowAPI  ```bash

  Port: 8000

  Protocol: TCP  nano .env## 🚀 DEPLOYMENT STEPS

  Source: Any

  Action: Allow  ```

  ```

### Step 1: Database Migration (5 minutes)

- [ ] Click Save

- [ ] Find and update these lines:

#### 1.5: Test Backend Externally (from your local machine)

- [ ] Test from Windows PowerShell:  ```bash- [ ] **Open Supabase Dashboard**

  ```powershell

  curl http://57.159.29.168:8000/health  # Update with YOUR Azure VM public IP:  - [ ] Navigate to your project

  # Expected: {"status":"healthy"}

  ```  GOOGLE_REDIRECT_URI=http://<YOUR-VM-IP>:8000/api/v1/auth/youtube/callback  - [ ] Go to SQL Editor



---  SPOTIFY_REDIRECT_URI=http://<YOUR-VM-IP>:8000/api/v1/agents/music/callback



### 🌐 STEP 2: Frontend (Vercel) Configuration  - [ ] **Run Migration Script**



**Time: 3 minutes | Vercel Dashboard Required**  # Add/update CORS (use YOUR Vercel URL):  - [ ] Click "New Query"



#### 2.1: Update Environment Variables  CORS_ORIGINS=https://bondhu-landing.vercel.app,https://*.vercel.app,http://localhost:3000  - [ ] Open `bondhu-ai/database/conversational_memory_schema.sql`

- [ ] Navigate to:

  ```  ```  - [ ] Copy entire content

  Vercel Dashboard → Your Project

  → Settings → Environment Variables  - [ ] Paste into SQL Editor

  ```

- [ ] Save file (Ctrl+X, Y, Enter)  - [ ] Click "Run" button

- [ ] Add/Update this variable:

  ```

  Key: NEXT_PUBLIC_API_URL

  Value: http://57.159.29.168:8000#### 1.2: Restart Docker Containers- [ ] **Verify Success**

  ```

- [ ] Run restart commands:  - [ ] Look for success message: "Conversational Memory System schema created successfully!"

- [ ] Click Save

  ```bash  - [ ] Check for any error messages (should be none)

#### 2.2: Redeploy (CRITICAL!)

- [ ] Go to: Deployments tab  docker-compose down

- [ ] Click "..." on latest deployment

- [ ] Click "Redeploy"  docker-compose up -d- [ ] **Verify Tables Created**

- [ ] Wait for deployment to complete

- [ ] **Note:** Environment variables only apply to NEW builds!  ```  - [ ] Go to Table Editor



#### 2.3: Test Frontend  - [ ] Confirm tables exist:

- [ ] Open https://bondhu.tech in browser

- [ ] Press F12 to open console- [ ] Verify all containers running:    - [ ] `conversation_memories` (should have 0 rows initially)

- [ ] Check for errors (should be none)

  ```bash    - [ ] `memory_index` (should have 0 rows initially)

---

  docker-compose ps    - [ ] `user_memories` (may have existing rows - that's OK)

### 🔐 STEP 3: Supabase OAuth Configuration

  # Expected: All show "Up (healthy)"

**Time: 2 minutes | Supabase Dashboard Required**

  ```- [ ] **Verify Indexes Created**

#### 3.1: Update Site URL

- [ ] Go to: https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs  - [ ] In SQL Editor, run:

- [ ] Navigate to: Authentication → URL Configuration

- [ ] Set Site URL to:#### 1.3: Test Backend Locally (from VM)    ```sql

  ```

  https://bondhu.tech- [ ] Health check:    SELECT indexname FROM pg_indexes 

  ```

- [ ] Click Save  ```bash    WHERE tablename IN ('conversation_memories', 'memory_index', 'user_memories')



#### 3.2: Add Redirect URLs  curl http://localhost:8000/health    ORDER BY tablename, indexname;

- [ ] In same page (URL Configuration)

- [ ] Add ALL these redirect URLs:  # Expected: {"status":"healthy"}    ```

  ```

  https://bondhu.tech/auth/callback  ```  - [ ] Should see 12+ indexes listed

  https://bondhu.tech/**

  https://*.vercel.app/auth/callback

  https://*.vercel.app/**

  http://localhost:3000/auth/callback#### 1.4: Open Port 8000 in Azure NSG- [ ] **Verify RLS Policies**

  http://localhost:3000/**

  ```- [ ] Navigate to:  - [ ] In SQL Editor, run:

- [ ] Click Save

  ```    ```sql

#### 3.3: Test Google Sign-In

- [ ] Go to: `https://bondhu.tech/sign-in`  Azure Portal → Virtual Machines → Your VM    SELECT tablename, policyname FROM pg_policies 

- [ ] Click "Continue with Google"

- [ ] Complete OAuth flow  → Networking → Network Settings    WHERE tablename IN ('conversation_memories', 'memory_index', 'user_memories');

- [ ] Should redirect to dashboard

- [ ] Should be logged in  → Add inbound port rule    ```



---  ```  - [ ] Should see policies for all three tables



### 🎬 STEP 4: Google Cloud Console (YouTube Integration)



**Time: 2 minutes | Google Cloud Console Required**- [ ] Configure rule:---



#### 4.1: Update OAuth Redirect URIs  ```

- [ ] Go to: https://console.cloud.google.com

- [ ] Navigate to: APIs & Services → Credentials  Priority: 1000### Step 2: Backend Restart (2 minutes)

- [ ] Find OAuth 2.0 Client ID

- [ ] Click edit (pencil icon)  Name: AllowAPI



#### 4.2: Add Authorized Redirect URIs  Port: 8000- [ ] **Stop Current Backend** (if running)

- [ ] Add these URIs:

  ```  Protocol: TCP  - [ ] Press `Ctrl+C` in terminal running `python main.py`

  https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback

  http://57.159.29.168:8000/api/v1/auth/youtube/callback  Source: Any

  https://bondhu.tech/auth/callback

  ```  Action: Allow- [ ] **Restart Backend**

- [ ] Click Save

  ```  ```bash

#### 4.3: Test YouTube Connection

- [ ] Sign in to: `https://bondhu.tech`  cd bondhu-ai

- [ ] Go to: Settings

- [ ] Click: "Connect YouTube"- [ ] Click Save  python main.py

- [ ] Complete OAuth flow

- [ ] Should show "Connected"  ```



---#### 1.5: Test Backend Externally (from your local machine)



## ✅ Final Verification Tests- [ ] Test from Windows PowerShell:- [ ] **Check Startup Logs**



### Test 1: Backend Health  ```powershell  - [ ] Look for: "Starting Bondhu AI application"

```powershell

# From PowerShell  curl http://<YOUR-VM-IP>:8000/health  - [ ] Look for: "Configuration loaded successfully"

curl http://57.159.29.168:8000/health

# Expected: {"status":"healthy"}  # Expected: {"status":"healthy"}  - [ ] Look for: "Database services initialized"

```

- [ ] ✅ Backend is accessible  ```  - [ ] Look for: "Orchestrator initialized successfully"



### Test 2: Frontend Loads  - [ ] NO import errors related to memory modules

```

→ Open: https://bondhu.tech---

→ F12 console should show no errors

```- [ ] **Verify Server Running**

- [ ] ✅ Frontend loads successfully

### 🌐 STEP 2: Frontend (Vercel) Configuration  - [ ] Should see: "Uvicorn running on http://0.0.0.0:8000"

### Test 3: Google Authentication

```

→ Click "Sign in with Google"

→ Complete authentication**Time: 3 minutes | Vercel Dashboard Required**---

→ Should redirect to /dashboard

```

- [ ] ✅ Authentication works

#### 2.1: Get Vercel Deployment URL### Step 3: Health Check (2 minutes)

### Test 4: Chat Integration (requires backend)

```- [ ] Go to: https://vercel.com/dashboard

→ Go to dashboard

→ Open chat- [ ] Find project: `bondhu-landing`- [ ] **Test Main API Health**

→ Send message

→ Should receive AI response- [ ] Copy deployment URL  ```bash

```

- [ ] ✅ Chat works- [ ] Write it here: `_______________________________`  curl http://localhost:8000/health



### Test 5: YouTube Integration (requires backend)  ```

```

→ Go to Settings#### 2.2: Update Environment Variables  - [ ] Status: 200 OK

→ Click "Connect YouTube"

→ Complete OAuth- [ ] Navigate to:  - [ ] Response includes: `"status": "healthy"`

→ Should show connected

```  ```

- [ ] ✅ YouTube integration works

  Vercel Dashboard → Your Project- [ ] **Test Memory Service Health**

---

  → Settings → Environment Variables  ```bash

## 🚨 Troubleshooting

  ```  curl http://localhost:8000/api/v1/memory/health

### ❌ Issue: Frontend can't reach backend

  ```

**Symptoms:** Network errors, "Failed to fetch", Chat doesn't work

- [ ] Add/Update variable:  - [ ] Status: 200 OK

**Checklist:**

```bash  ```  - [ ] Response includes: `"service": "memory"`, `"status": "healthy"`

# 1. Backend running?

ssh Bondhu_backend@57.159.29.168  Key: NEXT_PUBLIC_API_URL

docker-compose ps

  Value: http://<YOUR-AZURE-VM-IP>:8000- [ ] **Test Chat Service** (should still work)

# 2. Port 8000 accessible?

curl http://57.159.29.168:8000/health    ```bash



# 3. NSG rule exists?  Example: http://20.124.45.89:8000  curl http://localhost:8000/api/v1/chat/health

→ Azure Portal → VM → Networking → Verify port 8000

  ```  ```

# 4. CORS configured?

cd ~/Project-Noor/bondhu-ai  - [ ] Status: 200 OK

grep CORS_ORIGINS .env

# Should include: https://bondhu.tech- [ ] Click Save

```

---

### ❌ Issue: OAuth redirects to wrong URL

#### 2.3: Redeploy (CRITICAL!)

**Symptoms:** After Google sign-in, goes to wrong domain or localhost

- [ ] Go to: Deployments tab### Step 4: Functional Testing (6 minutes)

**Fix:**

```- [ ] Click "..." on latest deployment

→ Supabase Dashboard

→ Authentication → URL Configuration- [ ] Click "Redeploy"#### Test 4A: Memory Extraction (2 min)

→ Verify Site URL is: https://bondhu.tech (NOT localhost or vercel.app)

→ Clear browser cache- [ ] Wait for deployment to complete

→ Try again

```- [ ] **Note:** Environment variables only apply to NEW builds!- [ ] **Send Test Message**



### ❌ Issue: Vercel using old API URL  ```bash



**Symptoms:** Environment variable updated but not working#### 2.4: Test Frontend  curl -X POST http://localhost:8000/api/v1/chat/send \



**Fix:**- [ ] Open your Vercel URL in browser    -H "Content-Type: application/json" \

```

→ Vercel Dashboard → Deployments- [ ] Press F12 to open console    -d '{

→ Redeploy latest deployment

(Env vars only apply to NEW builds!)- [ ] Check for errors (should be none)      "user_id": "YOUR_USER_ID",

```

      "message": "My favorite anime is Re:Zero and my favorite character is Natsuki Subaru"

### ❌ Issue: CORS errors

---    }'

**Symptoms:** Console shows "Access to fetch blocked by CORS policy"

  ```

**Fix:**

```bash### 🔐 STEP 3: Supabase OAuth Configuration  - [ ] Response status: 200 OK

ssh Bondhu_backend@57.159.29.168

cd ~/Project-Noor/bondhu-ai  - [ ] Response includes: `"response": "..."`

nano .env

**Time: 2 minutes | Supabase Dashboard Required**  - [ ] Response includes: `"has_personality_context": true/false`

# Verify this line exists and is correct:

CORS_ORIGINS=https://bondhu.tech,https://*.vercel.app,http://localhost:3000



# Restart:#### 3.1: Update Site URL- [ ] **Verify Memory Extraction in Database**

docker-compose restart bondhu-api

```- [ ] Go to: https://app.supabase.com/project/eilvtjkqmvmhkfzocrzs  ```sql



---- [ ] Navigate to: Authentication → URL Configuration  SELECT * FROM user_memories WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;



## 📊 Architecture Overview- [ ] Set Site URL to:  ```



```  ```  - [ ] Should see entries for:

👤 User

  ↓  https://bondhu-landing.vercel.app    - [ ] `key = 'favorite_anime'`, `value = 'Re:Zero'`

[HTTPS] Secure connection

  ↓  (or your custom domain)    - [ ] `key = 'favorite_character'`, `value = 'Natsuki Subaru'`

┌──────────────────┐

│ Vercel CDN       │  Frontend (Next.js)  ```

│ SSL Enabled      │  https://bondhu.tech

└──────────────────┘- [ ] Click Save- [ ] **Verify via API**

  ↓

[HTTP] API calls  ```bash

  ↓

┌──────────────────┐#### 3.2: Add Redirect URLs  curl http://localhost:8000/api/v1/memory/stats/YOUR_USER_ID

│ Azure VM         │  Backend (Docker)

│ 57.159.29.168    │  http://57.159.29.168:8000- [ ] In same page (URL Configuration)  ```

│ Port 8000        │

│                  │- [ ] Add ALL these redirect URLs:  - [ ] `total_user_facts` should be >= 2

│ • Redis          │

│ • FastAPI        │  ```

│ • Celery Worker  │

└──────────────────┘  https://bondhu-landing.vercel.app/auth/callback#### Test 4B: Conversation Summarization (2 min)

  ↓

[PostgreSQL]  https://bondhu-landing.vercel.app/**

  ↓

┌──────────────────┐  https://*.vercel.app/auth/callback- [ ] **Have a Short Conversation**

│ Supabase         │  Database

│ PostgreSQL       │  Auth & Storage  https://*.vercel.app/**  - [ ] Send 3-5 messages back and forth

└──────────────────┘

```  http://localhost:3000/auth/callback  - [ ] Note the session_id from responses



---  http://localhost:3000/**



## 📝 Configuration Summary  ```- [ ] **Trigger Manual Summarization**



### What You Need to Update:- [ ] Click Save  ```bash



| Component | What to Change | New Value |  curl -X POST http://localhost:8000/api/v1/memory/summarize \

|-----------|---------------|-----------|

| **Vercel Env** | `NEXT_PUBLIC_API_URL` | `http://57.159.29.168:8000` |#### 3.3: Test Google Sign-In    -H "Content-Type: application/json" \

| **Backend .env** | `GOOGLE_REDIRECT_URI` | `http://57.159.29.168:8000/api/v1/auth/youtube/callback` |

| **Backend .env** | `SPOTIFY_REDIRECT_URI` | `http://57.159.29.168:8000/api/v1/agents/music/callback` |- [ ] Go to: `https://bondhu-landing.vercel.app/sign-in`    -d '{

| **Backend .env** | `CORS_ORIGINS` | `https://bondhu.tech,https://*.vercel.app` |

| **Azure NSG** | Port 8000 | Open (TCP, Inbound) |- [ ] Click "Continue with Google"      "user_id": "YOUR_USER_ID",

| **Supabase** | Site URL | `https://bondhu.tech` |

| **Supabase** | Redirect URLs | Add `https://bondhu.tech/*` |- [ ] Complete OAuth flow      "session_id": "YOUR_SESSION_ID"

| **Google OAuth** | Redirect URIs | Add backend + frontend URLs |

- [ ] Should redirect to dashboard    }'

### Your Final URLs:

- [ ] Should be logged in  ```

```

Frontend:     https://bondhu.tech  - [ ] Response: `"success": true`

Backend API:  http://57.159.29.168:8000

API Docs:     http://57.159.29.168:8000/docs---  - [ ] Response: `"message": "Conversation ... summarized successfully"`

Database:     https://eilvtjkqmvmhkfzocrzs.supabase.co

```



---### 🎬 STEP 4: Google Cloud Console (YouTube Integration)- [ ] **Verify Conversation Memory Created**



## 🎉 All Done!  ```bash



Once all checkboxes are complete, your production setup is ready!**Time: 2 minutes | Google Cloud Console Required**  curl http://localhost:8000/api/v1/memory/conversations/YOUR_USER_ID



**Test the full flow:**  ```

1. ✅ Visit https://bondhu.tech

2. ✅ Sign in with Google#### 4.1: Update OAuth Redirect URIs  - [ ] `total` should be >= 1

3. ✅ Complete personality assessment

4. ✅ Test chat (requires backend)- [ ] Go to: https://console.cloud.google.com  - [ ] Should see conversation with:

5. ✅ Connect YouTube (requires backend)

- [ ] Navigate to: APIs & Services → Credentials    - [ ] `conversation_summary` (text)

**Monitor health:**

```bash- [ ] Find OAuth 2.0 Client ID    - [ ] `topics` (array)

# Check backend

ssh Bondhu_backend@57.159.29.168- [ ] Click edit (pencil icon)    - [ ] `key_points` (array)

cd ~/Project-Noor/bondhu-ai

./monitor-containers.sh

```

#### 4.2: Add Authorized Redirect URIs- [ ] **Verify in Database**

**For detailed explanations, see:** `PRODUCTION_DOMAIN_CONFIG.md`

- [ ] Add these URIs:  ```sql

  ```  SELECT * FROM conversation_memories WHERE user_id = 'YOUR_USER_ID';

  https://eilvtjkqmvmhkfzocrzs.supabase.co/auth/v1/callback  ```

  http://<YOUR-AZURE-VM-IP>:8000/api/v1/auth/youtube/callback  - [ ] Should see 1 row with summary, topics, emotions

  https://bondhu-landing.vercel.app/auth/callback

  ```#### Test 4C: Reference Detection (2 min)

- [ ] Click Save

- [ ] **Send Reference Message**

#### 4.3: Test YouTube Connection  ```bash

- [ ] Sign in to: `https://bondhu-landing.vercel.app`  curl -X POST http://localhost:8000/api/v1/chat/send \

- [ ] Go to: Settings    -H "Content-Type: application/json" \

- [ ] Click: "Connect YouTube"    -d '{

- [ ] Complete OAuth flow      "user_id": "YOUR_USER_ID",

- [ ] Should show "Connected"      "message": "Remember that anime character I mentioned before?"

    }'

---  ```

  - [ ] Response status: 200 OK

## ✅ Final Verification Tests

- [ ] **Check Response Content**

### Test 1: Backend Health  - [ ] LLM response should reference "Natsuki Subaru" or "Re:Zero"

```powershell  - [ ] Response shows continuity (mentions past conversation)

# From PowerShell

Invoke-WebRequest -Uri "http://<YOUR-VM-IP>:8000/health"- [ ] **Check Backend Logs**

# Status: 200 OK  - [ ] Look for: "Added conversational memory context"

```  - [ ] Look for: "Detected reference phrase"

- [ ] ✅ Backend is accessible

---

### Test 2: Frontend Loads

```## 🧪 ADVANCED TESTING (Optional, 5 minutes)

→ Open: https://bondhu-landing.vercel.app

→ F12 console should show no errors### Test Timeline

```

- [ ] ✅ Frontend loads successfully- [ ] **Get Conversation Timeline**

  ```bash

### Test 3: Google Authentication  curl http://localhost:8000/api/v1/memory/timeline/YOUR_USER_ID?days=30

```  ```

→ Click "Sign in with Google"  - [ ] Returns timeline with conversations

→ Complete authentication  - [ ] Includes dates, topics, summaries

→ Should redirect to /dashboard

```### Test Topic Search

- [ ] ✅ Authentication works

- [ ] **Get User Topics**

### Test 4: Chat Integration (requires backend)  ```bash

```  curl http://localhost:8000/api/v1/memory/topics/YOUR_USER_ID

→ Go to dashboard  ```

→ Open chat  - [ ] Returns topic frequency

→ Send message  - [ ] Shows top topics discussed

→ Should receive AI response

```### Test Memory Search

- [ ] ✅ Chat works

- [ ] **Search Memories**

### Test 5: YouTube Integration (requires backend)  ```bash

```  curl -X POST http://localhost:8000/api/v1/memory/search \

→ Go to Settings    -H "Content-Type: application/json" \

→ Click "Connect YouTube"    -d '{

→ Complete OAuth      "user_id": "YOUR_USER_ID",

→ Should show connected      "query": "anime"

```    }'

- [ ] ✅ YouTube integration works  ```

  - [ ] `found: true`

---  - [ ] Returns relevant memory



## 🚨 Troubleshooting---



### ❌ Issue: Frontend can't reach backend## 🔍 VERIFICATION QUERIES



**Symptoms:** Network errors, "Failed to fetch", Chat doesn't work### Database Health Check



**Checklist:**Run these in Supabase SQL Editor:

```bash

# 1. Backend running?- [ ] **Count Tables**

ssh Bondhu_backend@<VM-IP>  ```sql

docker-compose ps  SELECT COUNT(*) FROM information_schema.tables 

  WHERE table_name IN ('conversation_memories', 'memory_index', 'user_memories');

# 2. Port 8000 accessible?  ```

curl http://<VM-IP>:8000/health  - [ ] Result: 3



# 3. NSG rule exists?- [ ] **Count Indexes**

→ Azure Portal → VM → Networking → Verify port 8000  ```sql

  SELECT COUNT(*) FROM pg_indexes 

# 4. CORS configured?  WHERE tablename IN ('conversation_memories', 'memory_index', 'user_memories');

cd ~/Project-Noor/bondhu-ai  ```

grep CORS_ORIGINS .env  - [ ] Result: 12 or more

```

- [ ] **Verify RLS Enabled**

### ❌ Issue: OAuth redirects to localhost  ```sql

  SELECT tablename, rowsecurity FROM pg_tables 

**Symptoms:** After Google sign-in, goes to `localhost:3000`, "site can't be reached"  WHERE tablename IN ('conversation_memories', 'memory_index', 'user_memories');

  ```

**Fix:**  - [ ] All should have `rowsecurity = true`

```

→ Supabase Dashboard- [ ] **Test User Memory Query** (replace YOUR_USER_ID)

→ Authentication → URL Configuration  ```sql

→ Verify Site URL is Vercel domain (NOT localhost)  SELECT COUNT(*) FROM user_memories WHERE user_id = 'YOUR_USER_ID';

→ Clear browser cache  ```

→ Try again  - [ ] Should return count >= 0 (depends on test data)

```

---

### ❌ Issue: Vercel using old API URL

## 🐛 TROUBLESHOOTING

**Symptoms:** Environment variable updated but not working

### Issue: Import Errors on Startup

**Fix:**

```**Symptoms**: 

→ Vercel Dashboard → Deployments```

→ Redeploy latest deploymentModuleNotFoundError: No module named 'core.memory'

(Env vars only apply to NEW builds!)```

```

**Solution**:

### ❌ Issue: CORS errors- [ ] Verify all files in `bondhu-ai/core/memory/` exist

- [ ] Check `__init__.py` exists in memory folder

**Symptoms:** Console shows "Access to fetch blocked by CORS policy"- [ ] Restart Python server

- [ ] Check Python path includes project root

**Fix:**

```bash### Issue: Table Does Not Exist

ssh Bondhu_backend@<VM-IP>

cd ~/Project-Noor/bondhu-ai**Symptoms**:

nano .env```

relation "conversation_memories" does not exist

# Add/update:```

CORS_ORIGINS=https://bondhu-landing.vercel.app,https://*.vercel.app,http://localhost:3000

**Solution**:

# Restart:- [ ] Re-run database migration script

docker-compose restart bondhu-api- [ ] Verify you're connected to correct Supabase project

```- [ ] Check Table Editor in Supabase dashboard



---### Issue: Permission Denied (RLS)



## 📊 Architecture Overview**Symptoms**:

```

```permission denied for table conversation_memories

👤 User```

  ↓

[HTTPS] Secure connection**Solution**:

  ↓- [ ] Verify RLS policies were created

┌──────────────────┐- [ ] Check user is authenticated (has valid JWT)

│ Vercel CDN       │  Frontend (Next.js)- [ ] Run RLS policy creation statements again

│ SSL Enabled      │  https://bondhu-landing.vercel.app

└──────────────────┘### Issue: Memory Not Being Retrieved

  ↓

[HTTP] API calls**Symptoms**: LLM doesn't reference past conversations

  ↓

┌──────────────────┐**Debug Steps**:

│ Azure VM         │  Backend (Docker)- [ ] Check if conversation_memories table has data

│ Port 8000        │  http://<VM-IP>:8000  ```sql

│                  │  SELECT COUNT(*) FROM conversation_memories WHERE user_id = 'YOUR_USER_ID';

│ • Redis          │  ```

│ • FastAPI        │- [ ] Check backend logs for "Added conversational memory context"

│ • Celery Worker  │- [ ] Verify reference detection working (check logs)

└──────────────────┘- [ ] Try manually triggering summarization first

  ↓

[PostgreSQL]### Issue: Slow Performance

  ↓

┌──────────────────┐**Symptoms**: Chat responses taking > 3 seconds

│ Supabase         │  Database

│ PostgreSQL       │  Auth & Storage**Debug Steps**:

└──────────────────┘- [ ] Check database indexes exist

```  ```sql

  SELECT indexname FROM pg_indexes WHERE tablename = 'conversation_memories';

---  ```

- [ ] Monitor query performance in Supabase dashboard

## 📝 Summary- [ ] Check memory retrieval isn't fetching too many records

- [ ] Adjust `max_memories` parameter (default: 3)

### What You Updated:

---

| Component | What Changed | From → To |

|-----------|-------------|-----------|## 📊 POST-DEPLOYMENT MONITORING

| **Vercel Env** | `NEXT_PUBLIC_API_URL` | `localhost:8000` → `<VM-IP>:8000` |

| **Backend .env** | `GOOGLE_REDIRECT_URI` | ngrok URL → `<VM-IP>:8000/...` |### First 24 Hours

| **Backend .env** | `CORS_ORIGINS` | - → Vercel domains |

| **Azure NSG** | Port 8000 | Closed → Open |- [ ] **Monitor Error Logs**

| **Supabase** | Site URL | localhost → Vercel URL |  - [ ] Check backend logs for errors

| **Supabase** | Redirect URLs | Added Vercel URLs |  - [ ] Monitor Supabase logs for failed queries

| **Google OAuth** | Redirect URIs | Added VM + Supabase URLs |  - [ ] Track API response times



### URLs to Remember:- [ ] **Test with Real Users**

  - [ ] Have 2-3 users chat naturally

```  - [ ] Ask them to reference past conversations

Frontend:  https://bondhu-landing.vercel.app  - [ ] Collect feedback on continuity

Backend:   http://<YOUR-VM-IP>:8000

API Docs:  http://<YOUR-VM-IP>:8000/docs- [ ] **Check Database Growth**

Database:  https://eilvtjkqmvmhkfzocrzs.supabase.co  ```sql

```  SELECT 

    COUNT(*) as total_conversations,

---    AVG(ARRAY_LENGTH(topics, 1)) as avg_topics,

    COUNT(DISTINCT user_id) as total_users

## 🎉 All Done!  FROM conversation_memories;

  ```

Your production deployment is complete! 

### First Week

**Next Steps:**

1. Test all features thoroughly- [ ] **Performance Metrics**

2. Monitor backend logs: `docker-compose logs -f`  - [ ] Average chat response time

3. Consider setting up SSL for backend (see PRODUCTION_DOMAIN_CONFIG.md)  - [ ] Memory retrieval time

4. Set up monitoring/alerts for production  - [ ] Database query performance



**For detailed explanations, see:** `PRODUCTION_DOMAIN_CONFIG.md`- [ ] **Usage Metrics**

  - [ ] Number of conversations summarized
  - [ ] Memory extraction success rate
  - [ ] Reference detection accuracy

- [ ] **User Feedback**
  - [ ] Survey users about conversation continuity
  - [ ] Track "I don't remember" type responses
  - [ ] Monitor user satisfaction scores

---

## 🎯 SUCCESS CRITERIA

### Technical Success

- [x] All tests pass (Steps 1-4)
- [ ] No import errors
- [ ] No database errors
- [ ] Chat API still works
- [ ] Memory API endpoints functional
- [ ] Response times < 2 seconds

### Functional Success

- [ ] Memory extraction works (facts stored)
- [ ] Conversation summarization works
- [ ] Reference detection works
- [ ] LLM provides contextual responses
- [ ] Timeline shows conversations

### User Success

- [ ] Users can reference past conversations
- [ ] LLM responds with continuity
- [ ] No "I don't remember" errors
- [ ] Natural conversation flow

---

## 🎉 DEPLOYMENT COMPLETE!

Once all checkboxes are marked:

✅ **Database**: Tables, indexes, RLS policies created  
✅ **Backend**: Memory system integrated and running  
✅ **API**: All endpoints functional  
✅ **Testing**: Core functionality verified  
✅ **Monitoring**: Tracking in place  

**Status**: 🚀 **PRODUCTION READY**

---

## 📝 NOTES

**Deployment Date**: _______________

**Deployed By**: _______________

**Database**: Supabase Project ID: _______________

**Backend URL**: _______________

**Issues Encountered**: 

- 
- 
- 

**Resolutions**:

- 
- 
- 

**Post-Deployment Tasks**:

- [ ] Update team documentation
- [ ] Notify users of new memory features
- [ ] Schedule follow-up review (1 week)
- [ ] Plan Phase 2 enhancements

---

**Last Updated**: October 7, 2025  
**Version**: 1.0.0  
**Status**: Ready for Production Deployment
