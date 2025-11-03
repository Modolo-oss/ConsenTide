/**
 * Supabase-backed Governance Service (El Paca voting)
 */

import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import {
  PrivacyProposal,
  VoteRecord,
  VoteChoice,
  VoteResult
} from '@consentire/shared';

class SupabaseGovernanceService {
  /** Create proposal */
  async createProposal(input: Omit<PrivacyProposal, 'proposalId' | 'createdAt'>, userId: string): Promise<PrivacyProposal> {
    const votingDeadline = input.votingDeadline || (Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from('governance_proposals')
      .insert({
        title: input.title,
        description: input.description,
        proposed_changes: input.proposedChanges,
        creator_id: userId,
        voting_deadline: new Date(votingDeadline).toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error || !data) {
      logger.error('Failed to create proposal', { error });
      throw new Error(error?.message || 'Failed to create proposal');
    }

    const proposal: PrivacyProposal = {
      proposalId: data.id,
      title: data.title,
      description: data.description,
      proposedChanges: data.proposed_changes,
      creatorSignature: input.creatorSignature || '',
      votingDeadline: new Date(data.voting_deadline).getTime(),
      createdAt: new Date(data.created_at).getTime()
    };

    return proposal;
  }

  /** List proposals */
  async listProposals(): Promise<PrivacyProposal[]> {
    const { data, error } = await supabaseAdmin
      .from('governance_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      proposalId: p.id,
      title: p.title,
      description: p.description,
      proposedChanges: p.proposed_changes,
      creatorSignature: '',
      votingDeadline: new Date(p.voting_deadline).getTime(),
      createdAt: new Date(p.created_at).getTime()
    }));
  }

  /** Get proposal + tally */
  async getProposalWithTally(proposalId: string): Promise<{ proposal: PrivacyProposal | null; tally: VoteResult }> {
    const { data: p, error } = await supabaseAdmin
      .from('governance_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (error) throw error;

    const { data: tallyData } = await supabaseAdmin
      .rpc('get_vote_tally', { proposal_id_param: proposalId });

    const tallyRow = Array.isArray(tallyData) ? tallyData[0] : tallyData;
    const tally: VoteResult = {
      proposalId,
      forVotes: Number(tallyRow?.for_votes || 0),
      againstVotes: Number(tallyRow?.against_votes || 0),
      abstainVotes: Number(tallyRow?.abstain_votes || 0),
      totalPower: Number(tallyRow?.total_power || 0),
      participation: Number(tallyRow?.participation_rate || 0)
    };

    const proposal: PrivacyProposal | null = p ? {
      proposalId: p.id,
      title: p.title,
      description: p.description,
      proposedChanges: p.proposed_changes,
      creatorSignature: '',
      votingDeadline: new Date(p.voting_deadline).getTime(),
      createdAt: new Date(p.created_at).getTime()
    } : null;

    return { proposal, tally };
  }

  /** Cast or update a vote */
  async castVote(proposalId: string, voterId: string, choice: VoteChoice): Promise<VoteRecord> {
    // Get voting power from balances
    const { data: balance } = await supabaseAdmin
      .from('el_paca_balances')
      .select('voting_power')
      .eq('user_id', voterId)
      .single();

    const power = Number(balance?.voting_power || 1);

    const { data, error } = await supabaseAdmin
      .from('governance_votes')
      .upsert({
        proposal_id: proposalId,
        voter_id: voterId,
        choice,
        voting_power: power
      }, { onConflict: 'proposal_id,voter_id' })
      .select()
      .single();

    if (error || !data) {
      logger.error('Failed to cast vote', { error });
      throw new Error(error?.message || 'Failed to cast vote');
    }

    const vote: VoteRecord = {
      voter: data.voter_id,
      proposalId: data.proposal_id,
      choice: data.choice,
      votingPower: Number(data.voting_power || power),
      timestamp: new Date(data.created_at).getTime()
    };

    return vote;
  }
}

export const supabaseGovernanceService = new SupabaseGovernanceService();

