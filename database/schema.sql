-- ConsenTide Database Schema for Supabase
-- GDPR-compliant consent management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE consent_status AS ENUM ('granted', 'revoked', 'expired');
CREATE TYPE lawful_basis AS ENUM ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests');
CREATE TYPE vote_choice AS ENUM ('for', 'against', 'abstain');
CREATE TYPE proposal_status AS ENUM ('active', 'passed', 'rejected', 'executed');

-- Controllers table (Data Controllers/Organizations)
CREATE TABLE controllers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  organization_id TEXT UNIQUE NOT NULL,
  controller_hash TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent records table (Core GDPR consent data)
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  controller_id UUID REFERENCES controllers(id) ON DELETE CASCADE,
  controller_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  purpose_hash TEXT NOT NULL,
  data_categories TEXT[] NOT NULL DEFAULT '{}',
  lawful_basis lawful_basis NOT NULL DEFAULT 'consent',
  status consent_status NOT NULL DEFAULT 'granted',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  hgtp_tx_hash TEXT,
  zk_proof JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > granted_at),
  CONSTRAINT valid_revocation CHECK (
    (status = 'revoked' AND revoked_at IS NOT NULL) OR 
    (status != 'revoked' AND revoked_at IS NULL)
  )
);

-- Audit logs table (Immutable audit trail)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_id UUID REFERENCES consent_records(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  controller_id UUID REFERENCES controllers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  hgtp_tx_hash TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Governance proposals table (El Paca governance)
CREATE TABLE governance_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_changes JSONB NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voting_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status proposal_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_deadline CHECK (voting_deadline > created_at)
);

-- Governance votes table
CREATE TABLE governance_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES governance_proposals(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  choice vote_choice NOT NULL,
  voting_power BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one vote per user per proposal
  UNIQUE(proposal_id, voter_id)
);

-- El Paca token balances table
CREATE TABLE el_paca_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance BIGINT NOT NULL DEFAULT 0,
  staked BIGINT NOT NULL DEFAULT 0,
  voting_power BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT non_negative_balance CHECK (balance >= 0),
  CONSTRAINT non_negative_staked CHECK (staked >= 0),
  CONSTRAINT non_negative_voting_power CHECK (voting_power >= 0)
);

-- User profiles table (Extended user information)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  public_key TEXT,
  wallet_address TEXT,
  did TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_controller_hash ON consent_records(controller_hash);
CREATE INDEX idx_consent_records_purpose_hash ON consent_records(purpose_hash);
CREATE INDEX idx_consent_records_status ON consent_records(status);
CREATE INDEX idx_consent_records_granted_at ON consent_records(granted_at);
CREATE INDEX idx_consent_records_expires_at ON consent_records(expires_at);

CREATE INDEX idx_audit_logs_consent_id ON audit_logs(consent_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_governance_proposals_status ON governance_proposals(status);
CREATE INDEX idx_governance_proposals_voting_deadline ON governance_proposals(voting_deadline);

CREATE INDEX idx_governance_votes_proposal_id ON governance_votes(proposal_id);
CREATE INDEX idx_governance_votes_voter_id ON governance_votes(voter_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_controllers_updated_at BEFORE UPDATE ON controllers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_governance_proposals_updated_at BEFORE UPDATE ON governance_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies for GDPR Compliance

-- Enable RLS on all tables
ALTER TABLE controllers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE el_paca_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Controllers policies
CREATE POLICY "Controllers are viewable by everyone" ON controllers
  FOR SELECT USING (true);

CREATE POLICY "Controllers can be inserted by authenticated users" ON controllers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Consent records policies (GDPR compliant)
CREATE POLICY "Users can view their own consent records" ON consent_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent records" ON consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent records" ON consent_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Governance proposals policies
CREATE POLICY "Proposals are viewable by everyone" ON governance_proposals
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create proposals" ON governance_proposals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Governance votes policies
CREATE POLICY "Users can view all votes" ON governance_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON governance_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- El Paca balances policies
CREATE POLICY "Users can view their own balance" ON el_paca_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage balances" ON el_paca_balances
  FOR ALL USING (auth.role() = 'service_role');

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Functions for business logic

-- Function to calculate compliance score
CREATE OR REPLACE FUNCTION calculate_compliance_score(controller_hash_param TEXT)
RETURNS NUMERIC AS $$
DECLARE
  total_consents INTEGER;
  active_consents INTEGER;
  compliance_score NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_consents
  FROM consent_records
  WHERE controller_hash = controller_hash_param;
  
  SELECT COUNT(*) INTO active_consents
  FROM consent_records
  WHERE controller_hash = controller_hash_param AND status = 'granted';
  
  IF total_consents = 0 THEN
    RETURN 100.0;
  END IF;
  
  compliance_score := (active_consents::NUMERIC / total_consents::NUMERIC) * 100.0;
  RETURN compliance_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire consents
CREATE OR REPLACE FUNCTION expire_old_consents()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE consent_records
  SET status = 'expired'
  WHERE status = 'granted'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vote tally for a proposal
CREATE OR REPLACE FUNCTION get_vote_tally(proposal_id_param UUID)
RETURNS TABLE(
  for_votes BIGINT,
  against_votes BIGINT,
  abstain_votes BIGINT,
  total_power BIGINT,
  participation_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN choice = 'for' THEN voting_power ELSE 0 END), 0) as for_votes,
    COALESCE(SUM(CASE WHEN choice = 'against' THEN voting_power ELSE 0 END), 0) as against_votes,
    COALESCE(SUM(CASE WHEN choice = 'abstain' THEN voting_power ELSE 0 END), 0) as abstain_votes,
    COALESCE(SUM(voting_power), 0) as total_power,
    CASE 
      WHEN (SELECT SUM(voting_power) FROM el_paca_balances) > 0 
      THEN (COALESCE(SUM(gv.voting_power), 0)::NUMERIC / (SELECT SUM(voting_power) FROM el_paca_balances)::NUMERIC) * 100.0
      ELSE 0.0
    END as participation_rate
  FROM governance_votes gv
  WHERE gv.proposal_id = proposal_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default El Paca balances for demo
INSERT INTO el_paca_balances (user_id, balance, voting_power) 
SELECT id, 1000, 1000 
FROM auth.users 
ON CONFLICT (user_id) DO NOTHING;

-- Create a scheduled job to expire old consents (if pg_cron is available)
-- SELECT cron.schedule('expire-consents', '0 0 * * *', 'SELECT expire_old_consents();');

COMMENT ON TABLE consent_records IS 'GDPR consent records with zero-knowledge privacy';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance';
COMMENT ON TABLE governance_proposals IS 'El Paca token governance proposals';
COMMENT ON TABLE governance_votes IS 'Token-weighted governance votes';
COMMENT ON TABLE el_paca_balances IS 'El Paca token balances and voting power';