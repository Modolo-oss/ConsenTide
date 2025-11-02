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
import { logger } from '../utils/logger';

export const userRouter = Router();

// In-memory user store (replace with database in production)
const userStore: Map<string, UserRegistrationResponse> = new Map();

/**
 * POST /api/v1/users/register
 * Register a new user
 */
userRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const request: UserRegistrationRequest = req.body;
    
    // Validate request
    if (!request.email || !request.publicKey) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: email, publicKey',
        timestamp: Date.now()
      } as APIError);
    }

    // Generate user identifiers
    const userId = generateUserId(request.email, request.publicKey);
    const did = generateDID(request.publicKey);
    const walletAddress = hash(request.publicKey).substring(0, 40); // Simulated wallet address

    const response: UserRegistrationResponse = {
      userId,
      did,
      walletAddress,
      createdAt: Date.now()
    };

    // Store user
    userStore.set(userId, response);

    logger.info('User registered', { userId, did });

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
 * GET /api/v1/users/:userId
 * Get user information
 */
userRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = userStore.get(userId);
    
    if (!user) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'User not found',
        timestamp: Date.now()
      } as APIError);
    }

    res.json(user);
  } catch (error: any) {
    logger.error('Error getting user', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get user',
      timestamp: Date.now()
    } as APIError);
  }
});
