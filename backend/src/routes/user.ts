/**
 * User API routes
 */

import { Router, Request, Response } from 'express';
import {
  UserRegistrationRequest,
  UserRegistrationResponse,
  APIError
} from '@consentire/shared';
import { generateUserId, generateDID, hash } from '../utils/crypto';
import { authenticateUser, createUserProfile, getUserProfile, requireOwnership } from '../middleware/supabaseAuth';
import { logger } from '../utils/logger';

export const userRouter = Router();

// Production: use Supabase user profiles

/**
 * POST /api/v1/users/register
 * Register a new user
 */
userRouter.post('/register', authenticateUser, async (req: Request, res: Response) => {
  try {
    const request: UserRegistrationRequest = req.body;
    if (!request.publicKey) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required field: publicKey',
        timestamp: Date.now()
      } as APIError);
    }

    await createUserProfile(req.user!.id, {
      email: req.user!.email,
      publicKey: request.publicKey,
      walletAddress: hash(request.publicKey).substring(0, 40),
      did: generateDID(request.publicKey),
      metadata: request.metadata || {}
    });

    const profile = await getUserProfile(req.user!.id);

    const response: UserRegistrationResponse = {
      userId: profile.id,
      did: profile.did,
      walletAddress: profile.wallet_address,
      createdAt: new Date(profile.created_at).getTime()
    };

    logger.info('User profile registered (Supabase)', { userId: response.userId });
    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error registering user', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to register user',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/users/me/profile
 * Get current authenticated user's profile
 */
userRouter.get('/me/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const profile = await getUserProfile(req.user!.id);
    const response: UserRegistrationResponse = {
      userId: profile.id,
      did: profile.did,
      walletAddress: profile.wallet_address,
      createdAt: new Date(profile.created_at).getTime()
    };
    res.json(response);
  } catch (error: any) {
    logger.error('Error getting current user profile', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get profile',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/users/:userId
 * Get user information
 */
userRouter.get('/:userId', authenticateUser, requireOwnership('userId'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await getUserProfile(userId);
    const response: UserRegistrationResponse = {
      userId: profile.id,
      did: profile.did,
      walletAddress: profile.wallet_address,
      createdAt: new Date(profile.created_at).getTime()
    };
    res.json(response);
  } catch (error: any) {
    logger.error('Error getting user', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get user',
      timestamp: Date.now()
    } as APIError);
  }
});
