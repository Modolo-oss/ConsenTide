/**
 * Controller (Organization) API routes
 */

import { Router, Request, Response } from 'express';
import {
  ControllerRegistrationRequest,
  ControllerRegistrationResponse,
  APIError
} from '@consentire/shared';
import { generateControllerHash } from '../utils/crypto';
import { logger } from '../utils/logger';

export const controllerRouter = Router();

// In-memory controller store (replace with database in production)
const controllerStore: Map<string, ControllerRegistrationResponse> = new Map();

/**
 * POST /api/v1/controllers/register
 * Register a new data controller (organization)
 */
controllerRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const request: ControllerRegistrationRequest = req.body;
    
    // Validate request
    if (!request.organizationName || !request.organizationId || !request.publicKey) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: organizationName, organizationId, publicKey',
        timestamp: Date.now()
      } as APIError);
    }

    // Generate controller identifiers
    const controllerId = hash(request.organizationId);
    const controllerHash = generateControllerHash(request.organizationId);

    const response: ControllerRegistrationResponse = {
      controllerId,
      controllerHash,
      registeredAt: Date.now()
    };

    // Store controller
    controllerStore.set(controllerId, response);

    logger.info('Controller registered', { controllerId, controllerHash });

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error registering controller', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to register controller',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/controllers/:controllerId
 * Get controller information
 */
controllerRouter.get('/:controllerId', async (req: Request, res: Response) => {
  try {
    const { controllerId } = req.params;
    const controller = controllerStore.get(controllerId);
    
    if (!controller) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Controller not found',
        timestamp: Date.now()
      } as APIError);
    }

    res.json(controller);
  } catch (error: any) {
    logger.error('Error getting controller', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get controller',
      timestamp: Date.now()
    } as APIError);
  }
});
