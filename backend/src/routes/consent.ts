/**
 * Consent API routes
 */

import { Router, Request, Response } from 'express';
import {
  ConsentGrantRequest,
  ConsentVerifyRequest,
  ConsentRevokeRequest,
  APIError
} from '@consentire/shared';
import { consentService } from '../services/consentService';
import { logger } from '../utils/logger';

export const consentRouter = Router();

/**
 * POST /api/v1/consent/grant
 * Grant consent
 */
consentRouter.post('/grant', async (req: Request, res: Response) => {
  try {
    const request: ConsentGrantRequest = req.body;
    
    // Validate request
    if (!request.userId || !request.controllerId || !request.purpose) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: userId, controllerId, purpose',
        timestamp: Date.now()
      } as APIError);
    }

    const result = await consentService.grantConsent(request);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Error granting consent', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to grant consent',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/consent/verify/:userId/:controllerId/:purpose
 * Verify consent (ZK - no personal data)
 */
consentRouter.get('/verify/:userId/:controllerId/:purpose', async (req: Request, res: Response) => {
  try {
    const { userId, controllerId, purpose } = req.params;
    
    const request: ConsentVerifyRequest = {
      userId: decodeURIComponent(userId),
      controllerId: decodeURIComponent(controllerId),
      purpose: decodeURIComponent(purpose)
    };

    const result = await consentService.verifyConsent(request);
    
    if (!result.isValid) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    logger.error('Error verifying consent', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to verify consent',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * POST /api/v1/consent/revoke/:consentId
 * Revoke consent
 */
consentRouter.post('/revoke/:consentId', async (req: Request, res: Response) => {
  try {
    const { consentId } = req.params;
    const { userId, signature } = req.body;
    
    if (!userId || !signature) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: userId, signature',
        timestamp: Date.now()
      } as APIError);
    }

    const request: ConsentRevokeRequest = {
      consentId,
      userId,
      signature
    };

    const result = await consentService.revokeConsent(request);
    res.json(result);
  } catch (error: any) {
    logger.error('Error revoking consent', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to revoke consent',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/consent/user/:userId
 * Get all active consents for a user
 */
consentRouter.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const consents = consentService.getActiveConsents(userId);
    res.json({ consents, count: consents.length });
  } catch (error: any) {
    logger.error('Error getting user consents', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get user consents',
      timestamp: Date.now()
    } as APIError);
  }
});
