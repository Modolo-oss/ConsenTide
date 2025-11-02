/**
 * Governance API routes (El Paca token voting)
 */

import { Router, Request, Response } from 'express';
import {
  PrivacyProposal,
  VoteRecord,
  VoteChoice,
  VoteResult,
  APIError
} from '@consentire/shared';
import { logger } from '../utils/logger';

export const governanceRouter = Router();

// In-memory stores (replace with database in production)
const proposalStore: Map<string, PrivacyProposal> = new Map();
const voteStore: Map<string, VoteRecord[]> = new Map();

/**
 * POST /api/v1/governance/proposals
 * Submit a privacy policy proposal
 */
governanceRouter.post('/proposals', async (req: Request, res: Response) => {
  try {
    const proposal: PrivacyProposal = req.body;
    
    // Validate request
    if (!proposal.title || !proposal.description || !proposal.creatorSignature) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: title, description, creatorSignature',
        timestamp: Date.now()
      } as APIError);
    }

    // Generate proposal ID
    const proposalId = require('crypto').createHash('sha256')
      .update(JSON.stringify(proposal))
      .digest('hex')
      .substring(0, 16);

    proposal.proposalId = proposalId;
    proposal.createdAt = Date.now();
    proposal.votingDeadline = proposal.votingDeadline || Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Store proposal
    proposalStore.set(proposalId, proposal);
    voteStore.set(proposalId, []);

    logger.info('Proposal created', { proposalId, title: proposal.title });

    res.status(201).json(proposal);
  } catch (error: any) {
    logger.error('Error creating proposal', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to create proposal',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/governance/proposals
 * Get all active proposals
 */
governanceRouter.get('/proposals', async (req: Request, res: Response) => {
  try {
    const proposals = Array.from(proposalStore.values());
    res.json({ proposals, count: proposals.length });
  } catch (error: any) {
    logger.error('Error getting proposals', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get proposals',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/governance/proposals/:proposalId
 * Get proposal details
 */
governanceRouter.get('/proposals/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const proposal = proposalStore.get(proposalId);
    
    if (!proposal) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Proposal not found',
        timestamp: Date.now()
      } as APIError);
    }

    // Get vote tally
    const votes = voteStore.get(proposalId) || [];
    const tally: VoteResult = {
      proposalId,
      forVotes: votes.filter(v => v.choice === VoteChoice.FOR).reduce((sum, v) => sum + v.votingPower, 0),
      againstVotes: votes.filter(v => v.choice === VoteChoice.AGAINST).reduce((sum, v) => sum + v.votingPower, 0),
      abstainVotes: votes.filter(v => v.choice === VoteChoice.ABSTAIN).reduce((sum, v) => sum + v.votingPower, 0),
      totalPower: votes.reduce((sum, v) => sum + v.votingPower, 0),
      participation: votes.length // Simplified participation metric
    };

    res.json({ proposal, tally });
  } catch (error: any) {
    logger.error('Error getting proposal', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get proposal',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * POST /api/v1/governance/vote
 * Cast a vote on a proposal
 */
governanceRouter.post('/vote', async (req: Request, res: Response) => {
  try {
    const vote: VoteRecord = req.body;
    
    // Validate request
    if (!vote.voter || !vote.proposalId || !vote.choice) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: voter, proposalId, choice',
        timestamp: Date.now()
      } as APIError);
    }

    // Check if proposal exists
    const proposal = proposalStore.get(vote.proposalId);
    if (!proposal) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Proposal not found',
        timestamp: Date.now()
      } as APIError);
    }

    // Check if voting deadline has passed
    if (Date.now() > proposal.votingDeadline) {
      return res.status(400).json({
        code: 'VOTING_CLOSED',
        message: 'Voting deadline has passed',
        timestamp: Date.now()
      } as APIError);
    }

    // TODO: Verify voter has sufficient El Paca tokens
    // For now, use placeholder voting power
    vote.votingPower = vote.votingPower || 1;
    vote.timestamp = Date.now();

    // Store vote
    const votes = voteStore.get(vote.proposalId) || [];
    // Remove existing vote from same voter
    const filteredVotes = votes.filter(v => v.voter !== vote.voter);
    filteredVotes.push(vote);
    voteStore.set(vote.proposalId, filteredVotes);

    logger.info('Vote cast', { proposalId: vote.proposalId, voter: vote.voter, choice: vote.choice });

    res.status(201).json(vote);
  } catch (error: any) {
    logger.error('Error casting vote', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to cast vote',
      timestamp: Date.now()
    } as APIError);
  }
});
