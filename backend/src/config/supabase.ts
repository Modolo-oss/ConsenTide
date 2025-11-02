/**
 * Supabase configuration for ConsenTide
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Service role client (for backend operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anonymous client (for public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);

// Database types
export interface ConsentRecord {
  id: string;
  user_id: string;
  controller_id: string;
  controller_hash: string;
  purpose: string;
  purpose_hash: string;
  data_categories: string[];
  lawful_basis: string;
  status: 'granted' | 'revoked' | 'expired';
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  hgtp_tx_hash?: string;
  zk_proof?: any;
  created_at: string;
  updated_at: string;
}

export interface ControllerRecord {
  id: string;
  organization_name: string;
  organization_id: string;
  controller_hash: string;
  public_key: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  consent_id?: string;
  user_id?: string;
  controller_id?: string;
  action: string;
  details: any;
  hgtp_tx_hash?: string;
  created_at: string;
}

export interface GovernanceProposalRecord {
  id: string;
  title: string;
  description: string;
  proposed_changes: any;
  creator_id: string;
  voting_deadline: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  created_at: string;
  updated_at: string;
}

export interface GovernanceVoteRecord {
  id: string;
  proposal_id: string;
  voter_id: string;
  choice: 'for' | 'against' | 'abstain';
  voting_power: number;
  created_at: string;
}

// Test connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('consent_records').select('count').limit(1);
    if (error) {
      logger.error('Supabase connection test failed', { error: error.message });
      return false;
    }
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection test error', { error });
    return false;
  }
}