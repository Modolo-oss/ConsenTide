# Railway Deployment Configuration

## Railway Services Architecture

### 1. Frontend Service (consentire-frontend)
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Backend Service (consentire-backend)
```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
COPY shared/dist ./shared/
RUN npm ci --only=production
COPY backend/ .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### 3. Metagraph Service (consentire-metagraph)
```dockerfile
# Dockerfile.metagraph
FROM openjdk:11-jre-slim
WORKDIR /app
COPY metagraph/target/scala-2.13/*.jar ./consentire-metagraph.jar
COPY p12-files/ ./certs/
EXPOSE 9200 9201 9202
CMD ["java", "-jar", "consentire-metagraph.jar", "run-initial-validator"]
```

### 4. Database Service
```yaml
# railway.toml
[build]
  builder = "dockerfile"

[deploy]
  healthcheckPath = "/health"
  restartPolicyType = "always"

[[services]]
name = "postgres"
source = "postgres:15"
```

## Environment Variables

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=${{BACKEND_URL}}
NEXT_PUBLIC_METAGRAPH_URL=${{METAGRAPH_URL}}
NEXT_PUBLIC_ENV=production
```

### Backend (.env.production)
```env
PORT=3001
DATABASE_URL=${{POSTGRES_URL}}
REDIS_URL=${{REDIS_URL}}
METAGRAPH_L0_URL=${{METAGRAPH_URL}}:9200
JWT_SECRET=${{JWT_SECRET}}
```

### Metagraph (.env.production)
```env
CL_APP_ENV=prod
CL_PUBLIC_HTTP_PORT=9200
CL_P2P_HTTP_PORT=9201
CL_CLI_HTTP_PORT=9202
CL_KEYSTORE=/app/certs/node1.p12
CL_KEYALIAS=node1
CL_PASSWORD=${{NODE_PASSWORD}}
```

## Railway Deployment Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new consentire-production

# Deploy services
railway up --service frontend
railway up --service backend  
railway up --service metagraph
railway up --service postgres
```

## Production Optimizations

### 1. Resource Allocation
- Frontend: 512MB RAM, 0.5 CPU
- Backend: 1GB RAM, 1 CPU
- Metagraph: 2GB RAM, 2 CPU (JVM needs more)
- Database: 1GB RAM, 1 CPU

### 2. Health Checks
```javascript
// backend/src/health.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      metagraph: 'connected',
      redis: 'connected'
    }
  });
});
```

### 3. Monitoring
```javascript
// Simple monitoring endpoint
app.get('/metrics', (req, res) => {
  res.json({
    consents: {
      total: consentCount,
      active: activeConsents,
      revoked: revokedConsents
    },
    performance: {
      avgResponseTime: avgResponseTime,
      requestsPerSecond: rps
    }
  });
});
```