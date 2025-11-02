# ConsenTide Supabase Setup Guide 🚀

## Quick Supabase Setup (15 minutes)

### Step 1: Create Supabase Project (5 minutes)

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Create New Project**
   - Click "New Project"
   - Organization: Choose or create
   - Name: `consentire-production`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
   - Click "Create new project"

3. **Wait for Setup** (2-3 minutes)
   - Project will be provisioned
   - Database will be initialized

### Step 2: Get API Keys (2 minutes)

1. **Go to Project Settings**
   - Click gear icon (⚙️) in sidebar
   - Go to "API" section

2. **Copy Keys**
   ```bash
   # Project URL
   SUPABASE_URL=https://your-project-ref.supabase.co
   
   # Public anon key (safe for frontend)
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Service role key (backend only - keep secret!)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Setup Database Schema (5 minutes)

1. **Go to SQL Editor**
   - Click "SQL Editor" in sidebar
   - Click "New query"

2. **Run Schema Script**
   - Copy content from `database/schema.sql`
   - Paste in SQL editor
   - Click "Run" (▶️)
   - Wait for completion (~30 seconds)

3. **Verify Tables Created**
   - Go to "Table Editor"
   - Should see tables: `consent_records`, `controllers`, `audit_logs`, etc.

### Step 4: Configure Authentication (3 minutes)

1. **Go to Authentication Settings**
   - Click "Authentication" in sidebar
   - Go to "Settings" tab

2. **Configure Auth Settings**
   ```
   ✅ Enable email confirmations: OFF (for demo)
   ✅ Enable phone confirmations: OFF
   ✅ Enable custom SMTP: OFF (use Supabase SMTP)
   ```

3. **Add Site URL**
   - Site URL: `http://localhost:3000` (development)
   - Additional URLs: Add your Railway frontend URL later

## Environment Variables Setup

### Backend (.env)
```bash
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
```

### Frontend (.env.local)
```bash
# Supabase (public keys only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_METAGRAPH_URL=http://localhost:9200
```

## Test Supabase Connection

### Backend Test
```bash
cd backend
npm run dev

# Should see in logs:
# ✅ Supabase connection successful
```

### Frontend Test
```bash
cd frontend
npm run dev

# Visit http://localhost:3000
# Should be able to register/login
```

## Railway Deployment with Supabase

### Update Railway Environment Variables
```bash
# After Railway deployment, set these variables:
railway variables set SUPABASE_URL=https://your-project-ref.supabase.co
railway variables set SUPABASE_ANON_KEY=your_anon_key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Update frontend URL in Supabase
# Go to Auth Settings → Site URL
# Add: https://your-frontend-url.railway.app
```

## Demo Data (Optional)

### Create Test Controller
```sql
INSERT INTO controllers (organization_name, organization_id, controller_hash, public_key)
VALUES ('Acme Corporation', 'acme-corp', 'hash_of_acme_corp', 'pk_acme_123');
```

### Create Test User (via frontend registration)
1. Visit frontend
2. Click "Register"
3. Fill form and submit
4. Check Supabase Auth → Users

## Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check SUPABASE_URL and keys are correct
   - Ensure no extra spaces in .env files

2. **"relation does not exist"**
   - Run database schema script again
   - Check SQL Editor for errors

3. **CORS errors**
   - Add your domain to Supabase Auth settings
   - Check Site URL configuration

4. **RLS policy errors**
   - Policies are configured in schema
   - Users can only access their own data

### Debug Commands
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://your-project-ref.supabase.co/rest/v1/consent_records

# Check backend logs
npm run dev

# Check frontend console
# Open browser dev tools → Console
```

## Security Notes

🔒 **Important Security**:
- Never commit `SUPABASE_SERVICE_ROLE_KEY` to git
- Use environment variables for all keys
- Service role key has admin access - backend only
- Anon key is safe for frontend use
- RLS policies protect user data

## Next Steps

After Supabase setup:
1. ✅ Test user registration/login
2. ✅ Test consent grant/revoke
3. ✅ Verify data persistence
4. ✅ Deploy to Railway
5. ✅ Update production URLs

**Total setup time: ~15 minutes**
**Result: Real database + auth instead of mocks! 🎉**