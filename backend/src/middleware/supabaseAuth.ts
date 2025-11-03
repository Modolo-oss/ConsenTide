/**
 * Supabase Authentication Middleware
 * Replaces mock authentication with real JWT verification
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using Supabase JWT
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        timestamp: Date.now()
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: user, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user.user) {
      logger.warn('Invalid token provided', { error: error?.message });
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        timestamp: Date.now()
      });
    }

    // Add user info to request
    const appMetadata = user.user.app_metadata as Record<string, any> | undefined;
    const userMetadata = user.user.user_metadata as Record<string, any> | undefined;
    const role = (appMetadata?.role || userMetadata?.role || user.user.role || 'user') as string;

    req.user = {
      id: user.user.id,
      email: user.user.email,
      role
    };

    logger.info('User authenticated', { 
      userId: user.user.id, 
      email: user.user.email 
    });

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({
      code: 'AUTH_ERROR',
      message: 'Authentication service error',
      timestamp: Date.now()
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const { data: user, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user.user) {
      const appMetadata = user.user.app_metadata as Record<string, any> | undefined;
      const userMetadata = user.user.user_metadata as Record<string, any> | undefined;
      const role = (appMetadata?.role || userMetadata?.role || user.user.role || 'user') as string;

      req.user = {
        id: user.user.id,
        email: user.user.email,
        role
      };
    }

    next();
  } catch (error) {
    logger.error('Optional auth error', { error });
    next(); // Continue even if auth fails
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      timestamp: Date.now()
    });
  }

  // Check if user has admin role (you can customize this logic)
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Admin access required',
      timestamp: Date.now()
    });
  }

  next();
};

/**
 * Middleware to ensure user owns the resource
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: Date.now()
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (req.user.id !== resourceUserId) {
      logger.warn('Ownership check failed', { 
        authenticatedUser: req.user.id, 
        resourceUser: resourceUserId 
      });
      
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Access denied: resource ownership required',
        timestamp: Date.now()
      });
    }

    next();
  };
};

/**
 * Create user profile after Supabase registration
 */
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        email: userData.email,
        public_key: userData.publicKey,
        wallet_address: userData.walletAddress,
        did: userData.did,
        metadata: userData.metadata || {}
      });

    if (error) {
      logger.error('Failed to create user profile', { error, userId });
      throw error;
    }

    // Initialize El Paca balance
    await supabaseAdmin
      .from('el_paca_balances')
      .insert({
        user_id: userId,
        balance: 1000, // Initial balance
        voting_power: 1000
      });

    logger.info('User profile created', { userId });
  } catch (error) {
    logger.error('Error creating user profile', { error, userId });
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return profile;
  } catch (error) {
    logger.error('Failed to get user profile', { error, userId });
    throw error;
  }
};
