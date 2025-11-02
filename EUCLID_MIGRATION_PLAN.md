# ConsenTide Euclid Migration Plan

## Current vs Target Structure

### Current Structure
```
Consentire/
├── frontend/          # Next.js dashboard
├── backend/           # Node.js API Gateway  
├── metagraph/         # Placeholder Scala code
├── shared/           # TypeScript types
└── docs/             # Documentation
```

### Target Euclid Structure
```
consentire-euclid/
├── modules/
│   ├── l0/                    # ConsenTide L0 (extends CurrencyL0App)
│   │   └── Main.scala         # Consent state machine + rewards
│   ├── l1/                    # Currency L1 (extends CurrencyL1App)  
│   │   └── Main.scala         # Transaction validation
│   ├── data_l1/               # Data L1 (extends DataApplication)
│   │   └── Main.scala         # GDPR data processing
│   └── shared_data/           # Shared types
│       ├── ConsentTypes.scala
│       ├── GDPRTypes.scala
│       └── ZKTypes.scala
├── source/
│   ├── metagraph-l0/
│   │   └── genesis/
│   │       └── genesis.csv    # El Paca token distribution
│   └── p12-files/             # Node key files
├── infra/                     # Docker + Ansible configs
└── scripts/                   # Hydra CLI
```

## Migration Steps

### Step 1: L0 Layer (Consent Engine)
```scala
// modules/l0/Main.scala
object Main extends CurrencyL0App(
  "ConsenTide",
  "GDPR Consent Management",
  ClusterStorage.make(),
  rewards = (snapshot, balances, transactions, trigger, events, dataState) => {
    // El Paca governance rewards
    ConsentRewards.calculateRewards(snapshot, balances, dataState)
  }
) {
  
  override def dataApplication: Option[DataApplication] = Some(
    ConsentDataApplication.make()
  )
  
  override def validateData = ConsentValidator.validateData
  override def combine = ConsentCombiner.combine
}
```

### Step 2: Data L1 Layer (GDPR Processing)
```scala
// modules/data_l1/Main.scala  
object Main extends CurrencyL1App(
  "ConsenTide-Data",
  "GDPR Data Processing",
  ClusterStorage.make()
) {
  
  override def dataApplication: Option[DataApplication] = Some(
    GDPRDataApplication.make()
  )
  
  override def validateUpdate = GDPRValidator.validateUpdate
}
```

### Step 3: Currency L1 Layer (El Paca Transactions)
```scala
// modules/l1/Main.scala
object Main extends CurrencyL1App(
  "ConsenTide-Currency", 
  "El Paca Token Layer",
  ClusterStorage.make()
) {
  
  override def transactionValidator = ElPacaValidator.validateTransaction
  override def transactionEstimator = ElPacaEstimator.estimateFee
}
```

### Step 4: Shared Data Types
```scala
// modules/shared_data/ConsentTypes.scala
case class ConsentUpdate(
  consentId: String,
  controllerId: String,
  purpose: String,
  dataCategories: List[String],
  lawfulBasis: LegalBasis,
  action: ConsentAction, // Grant, Revoke, Update
  zkProof: ZKProof,
  feeTransaction: Option[FeeTransaction] // v2.9.0+
) extends DataUpdate

case class ConsentState(
  activeConsents: Map[String, ConsentRecord],
  revokedConsents: Map[String, ConsentRecord],
  complianceMetrics: ComplianceMetrics
) extends CalculatedState
```

## Data Flow Integration

### 1. Consent Grant Flow
```
User Frontend → POST /data (Data L1) → validateUpdate → 
L1 Consensus → L0 validateData → combine → 
HGTP Snapshot → Global L0
```

### 2. ZK Verification Flow  
```
Controller API → GET /consent/verify → 
Query Calculated State → Generate ZK Proof → 
Return Boolean + Proofs (no personal data)
```

### 3. Governance Flow
```
Proposal Submission → POST /data → 
El Paca Balance Check → Voting Period → 
Token-weighted Consensus → Policy Update
```

## API Endpoints Mapping

### Current Backend API → Euclid Endpoints
- `POST /api/v1/consent/grant` → `POST /data` (ConsentUpdate)
- `GET /api/v1/consent/verify` → Custom endpoint on L0
- `POST /api/v1/governance/vote` → `POST /data` (GovernanceUpdate)
- `GET /api/v1/compliance/report` → Custom endpoint on L0

## Development Workflow

### 1. Local Development
```bash
# Build metagraph
scripts/hydra build

# Start from genesis  
scripts/hydra start-genesis

# Monitor with Grafana
open http://localhost:3000
```

### 2. Remote Deployment
```bash
# Configure hosts.ansible.yml
# Deploy to 3 nodes
scripts/hydra remote-deploy

# Start metagraph
scripts/hydra remote-start
```

### 3. Monitoring
```bash
# Check status
scripts/hydra remote-status

# View logs
tail -f logs/app.log
```

## Integration Benefits

### 1. Real HGTP Integration
- Actual immutable anchoring (not simulated)
- Merkle proofs for audit trails
- Cross-chain verification

### 2. Scalable Architecture  
- 10,000+ consent ops/second
- Horizontal scaling via Metagraph nodes
- <100ms ZK verification

### 3. Production Ready
- Constellation consensus reliability
- Built-in monitoring & alerting
- Auto-restart & health checks

### 4. Token Economics
- Real El Paca token on Constellation
- Governance voting with token weights
- Fee collection & distribution

## Timeline

- **Week 1**: Setup Euclid environment + basic L0
- **Week 2**: Implement Data L1 + consent processing  
- **Week 3**: Add Currency L1 + El Paca integration
- **Week 4**: Testing + deployment + monitoring

## Next Steps

1. Setup Euclid development environment
2. Migrate ConsentEngine to real L0App
3. Implement GDPR DataApplication
4. Add El Paca governance layer
5. Deploy to IntegrationNet for testing