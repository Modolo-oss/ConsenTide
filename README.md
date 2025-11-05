# ConsenTide - GDPR Consent Dynamic Ledger

**Zero-knowledge GDPR consent management with immutable audit trails and dynamic revocation capabilities**

## 🎯 Overview

ConsenTide is a privacy-first consent ledger that lets users grant, monitor, and revoke data-processing permissions across any organization—without exposing personal data. Built on Constellation's Hypergraph for true immutability and Metagraphs for custom compliance logic.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Front-End UI                   │
│  (User Dashboard • Admin Console • API Gateway) │
├─────────────────────────────────────────────────┤
│  ConsenTide Metagraph (Custom Logic + Token)    │
│  ├─ Consent State Engine                        │
│  ├─ ZKP Verification Service                    │
│  ├─ El Paca Governance Module                   │
│  └─ Cross‑Platform API Adapter                  │
├─────────────────────────────────────────────────┤
│         HGTP (Immutable Consent Ledger)         │
│  ├─ Hash‑chained consent records                │
│  ├─ Zero‑knowledge proof anchoring              │
│  └─ Cross‑chain verification endpoints          │
└─────────────────────────────────────────────────┘
```

## 🚀 Features

- ✅ **Zero-Knowledge Consent Proofs** – Verify consent without exposing personal data
- ✅ **Dynamic Consent Lifecycle** – Grant → Use → Revoke → Audit in real-time
- ✅ **Cross-Platform Integration** – RESTful API for any system (CRM, ERP, marketing tools)
- ✅ **Regulatory Compliance Dashboard** – Real-time GDPR Article 7 & 13 compliance status
- ✅ **Immutable Audit Trail** – Every consent action hash-anchored to HGTP
- ✅ **Token-Governed Privacy** – El Paca used for community voting on privacy policies
- ✅ **Production Database** – Railway PostgreSQL with auto-migration
- ✅ **Unified Authentication** – Email/password + Supabase OAuth integration
- ✅ **GDPR Compliant Schema** – Complete database schema with proper indexing

## 📁 Project Structure

```
Consentire/
├── frontend/          # Next.js React dashboard (User + Admin)
├── backend/           # Node.js Express API Gateway
├── metagraph/         # Scala L0 Metagraph implementation
├── database/          # PostgreSQL schema & migrations
├── shared/           # Shared TypeScript types & validation
├── scripts/          # Deployment & setup scripts
└── docs/             # Comprehensive documentation
```

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide!

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Scala 2.13+ (for Metagraph)
- sbt 1.8+ (for Metagraph)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build shared types:**
   ```bash
   cd shared && npm run build && cd ..
   ```

3. **Run backend API:**
   ```bash
   cd backend && npm run dev
   ```

4. **Run frontend (in new terminal):**
   ```bash
   cd frontend && npm run dev
   ```

5. **Build Metagraph (optional):**
   ```bash
   cd metagraph && sbt compile
   ```

For detailed setup instructions, see [docs/SETUP.md](./docs/SETUP.md).

## 🚀 Production Deployment

See [docs/PRODUCTION.md](./docs/PRODUCTION.md) for production deployment guide.
See [docs/PRODUCTION_ID.md](./docs/PRODUCTION_ID.md) for production guide in Indonesian (Bahasa Indonesia).

## 🗄️ Database Setup

### Railway PostgreSQL (Recommended)
1. **Create Railway account** at [railway.app](https://railway.app)
2. **Deploy PostgreSQL** service
3. **Copy environment variables** to `.env`
4. **Backend auto-creates schema** on first run

### Manual Schema Setup
```bash
# Run schema manually if needed
PGPASSWORD=your_password psql -h your_host -U postgres -p 5432 -d railway -f database/schema.sql
```

## 🔐 Authentication

### Supported Methods
- **Email/Password**: Traditional authentication
- **Supabase OAuth**: GitHub, Google, etc.
- **Unified Login**: Single system supporting both methods

### Demo Accounts
- **Admin**: `admin@consentire.io` / `admin123`
- **User**: `user@consentire.io` / `user123`
- **Organization**: `org@consentire.io` / `org123`
- **Regulator**: `regulator@consentire.io` / `reg123`

## 📖 API Documentation

See [docs/API.md](./docs/API.md) for full API documentation.

## 🏆 Current Status

### ✅ Completed Features
- **Database Integration**: Railway PostgreSQL with auto-migration
- **Authentication System**: Unified login (Email + Supabase OAuth)
- **User Interface**: Complete dashboard and admin console
- **API Gateway**: RESTful endpoints for all operations
- **GDPR Compliance**: Complete schema and validation
- **Demo System**: Ready-to-use accounts and data

### 🚧 In Development
- **ZK Proofs**: Zero-knowledge consent verification
- **HGTP Integration**: Constellation Hypergraph anchoring
- **Metagraph**: Scala L0 implementation
- **Production Deployment**: Cloud infrastructure setup

### 🎯 Hackathon Ready
- **Functional Prototype**: End-to-end consent management
- **Production Database**: Railway PostgreSQL
- **Scalable Architecture**: Modular, maintainable code
- **Documentation**: Complete setup and API guides

## 🔒 Security

- Zero-knowledge proofs for consent verification
- AES-256 encryption for personal data
- SHA-256 hashing for identifiers
- Immutable HGTP anchoring
- Multi-signature validation

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

## 🤝 Contributing

This project is built for the Constellation x LegalTech Hackathon. Contributions welcome!

## 📞 Contact

- GitHub: [ConsenTide](https://github.com/consentire)
- Discord: Constellation Community
