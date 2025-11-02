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

## 📁 Project Structure

```
Consentire/
├── frontend/          # React dashboard (User + Admin)
├── backend/           # Node.js API Gateway
├── metagraph/         # Scala L0 Metagraph implementation
├── contracts/         # Smart contracts & ZK circuits
├── shared/           # Shared TypeScript types
└── docs/             # Documentation
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

## 📖 API Documentation

See [API.md](./docs/API.md) for full API documentation.

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
