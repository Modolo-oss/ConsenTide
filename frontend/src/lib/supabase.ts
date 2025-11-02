/**
 * Supabase client configuration for ConsenTide frontend
 */

import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client-side Supabase client
export const createClient = () => createClientComponentClient();

// Server-side Supabase client
export const createServerClient = () => createServerComponentClient({ cookies });

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
  controllers?: {
    organization_name: string;
    organization_id: string;
  };
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

export interface UserProfile {
  id: string;
  email?: string;
  public_key?: string;
  wallet_address?: string;
  did?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ElPacaBalance {
  id: string;
  user_id: string;
  balance: number;
  staked: number;
  voting_power: number;
  last_updated: string;
}