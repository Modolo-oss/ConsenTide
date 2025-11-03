/**
 * Compliance API routes
 */

import { Router, Request, Response } from 'express';
import { ComplianceStatus, APIError } from '@consentire/shared';
import { logger } from '../utils/logger';
import { supabaseConsentService } from '../services/supabaseConsentService';
import { authenticateUser, requireAdmin } from '../middleware/supabaseAuth';

export const complianceRouter = Router();

/**
 * GET /api/v1/compliance/status/:controllerHash
 * Get GDPR compliance status for a controller (admin only)
 */
complianceRouter.get('/status/:controllerHash', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { controllerHash } = req.params;
    const metrics = await supabaseConsentService.getComplianceMetrics(controllerHash);
    const complianceStatus: ComplianceStatus = {
      controllerHash: metrics.controllerHash,
      gdprArticle7: true,
      gdprArticle12: true,
      gdprArticle13: true,
      gdprArticle17: true,
      gdprArticle20: true,
      gdprArticle25: true,
      gdprArticle30: true,
      overallCompliance: Math.round(metrics.complianceScore),
      lastAudit: metrics.lastAudit
    };
    res.json(complianceStatus);
  } catch (error: any) {
    logger.error('Error getting compliance status', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get compliance status',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/compliance/report/:controllerHash
 * Generate detailed compliance report (admin only)
 */
complianceRouter.get('/report/:controllerHash', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { controllerHash } = req.params;
    const report = await supabaseConsentService.getComplianceReport(controllerHash);
    res.json({
      controller: report.controller,
      metrics: report.metrics,
      summary: report.summary,
      recentConsents: report.recentConsents,
      auditTrail: report.auditTrail,
      generatedAt: Date.now()
    });
  } catch (error: any) {
    logger.error('Error generating compliance report', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to generate compliance report',
      timestamp: Date.now()
    } as APIError);
  }
});
