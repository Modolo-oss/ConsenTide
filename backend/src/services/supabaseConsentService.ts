/**
 * Supabase-powered Consent Service
 * Replaces mock in-memory implementation with real database
 */

import {
  ConsentGrantRequest,
  ConsentGrantResponse,
  ConsentVerifyRequest,
  ConsentVerifyResponse,
  ConsentRevokeRequest,
  ConsentRevokeResponse,
  ConsentStatus
} from '@consentire/shared';
import { supabaseAdmin, ConsentRecord, AuditLogRecord } from '../config/supabase';
import { realZKService } from './realZKService';
import { realHGTPService } from './realHGTPService';
import { 
  hash, 
  generateConsentId, 
  generateControllerHash, 
  generatePurposeHash 
} from '../utils/crypto';
import { logger } from '../utils/logger';

class SupabaseConsentService {
  
  /**
   * Grant consent with Supabase persistence
   */
  async grantConsent(request: ConsentGrantRequest, userId: string): Promise<ConsentGrantResponse> {
    logger.info('Granting consent via Supabase', { userId, controllerId: request.controllerId });

    try {
      // Generate hashes
      const controllerHash = generateControllerHash(request.controllerId);
      const purposeHash = generatePurposeHash(request.purpose);
      const timestamp = Date.now();
      const consentId = generateConsentId(
        userId,
        request.controllerId,
        request.purpose,
        timestamp
      );

      // Check if consent already exists
      const { data: existingConsent } = await supabaseAdmin
        .from('consent_records')
        .select('id')
        .eq('user_id', userId)
        .eq('controller_hash', controllerHash)
        .eq('purpose_hash', purposeHash)
        .eq('status', 'granted')
        .single();

      if (existingConsent) {
        throw new Error('Active consent already exists for this purpose');
      }

      // Get controller info
      const { data: controller } = await supabaseAdmin
        .from('controllers')
        .select('id')
        .eq('organization_id', request.controllerId)
        .single();

      if (!controller) {
        throw new Error('Controller not found. Please register the organization first.');
      }

      // Generate ZK proof
      const zkProof = await realZKService.generateConsentProof({
        userId,
        controllerId: request.controllerId,
        purpose: request.purpose,
        dataCategories: request.dataCategories,
        lawfulBasis: request.lawfulBasis
      });

      // Create consent record
      const consentRecord: Partial<ConsentRecord> = {
        id: consentId,
        user_id: userId,
        controller_id: controller.id,
        controller_hash: controllerHash,
        purpose: request.purpose,
        purpose_hash: purposeHash,
        data_categories: request.dataCategories,
        lawful_basis: request.lawfulBasis as any,
        status: 'granted',
        granted_at: new Date(timestamp).toISOString(),
        expires_at: request.expiresAt ? new Date(request.expiresAt).toISOString() : null,
        zk_proof: zkProof
      };

      // Insert consent record
      const { data: insertedConsent, error: insertError } = await supabaseAdmin
        .from('consent_records')
        .insert(consentRecord)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert consent: ${insertError.message}`);
      }

      // Anchor to HGTP (real implementation)
      const hgtpResult = await realHGTPService.anchorConsent({
        consentId,
        controllerHash,
        purposeHash,
        status: ConsentStatus.GRANTED,
        grantedAt: timestamp,
        expiresAt: request.expiresAt,
        hgtpTxHash: '',
        userId: hash(userId)
      });

      // Update with HGTP transaction hash
      await supabaseAdmin
        .from('consent_records')
        .update({ hgtp_tx_hash: hgtpResult.transactionHash })
        .eq('id', consentId);

      // Create audit log
      await this.createAuditLog({
        consent_id: consentId,
        user_id: userId,
        controller_id: controller.id,
        action: 'consent_granted',
        details: {
          purpose: request.purpose,
          lawfulBasis: request.lawfulBasis,
          dataCategories: request.dataCategories
        },
        hgtp_tx_hash: hgtpResult.transactionHash
      });

      logger.info('Consent granted successfully', { 
        consentId, 
        hgtpTxHash: hgtpResult.transactionHash 
      });

      return {
        consentId,
        hgtpTxHash: hgtpResult.transactionHash,
        status: ConsentStatus.GRANTED,
        expiresAt: request.expiresAt,
        grantedAt: timestamp
      };

    } catch (error) {
      logger.error('Failed to grant consent', { error, userId, controllerId: request.controllerId });
      throw error;
    }
  }

  /**
   * Verify consent with ZK proof (no personal data exposure)
   */
  async verifyConsent(request: ConsentVerifyRequest): Promise<ConsentVerifyResponse> {
    logger.info('Verifying consent via Supabase', { 
      userId: request.userId, 
      controllerId: request.controllerId 
    });

    try {
      const controllerHash = generateControllerHash(request.controllerId);
      const purposeHash = generatePurposeHash(request.purpose);

      // Find consent record
      const { data: consentRecord, error } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('user_id', request.userId)
        .eq('controller_hash', controllerHash)
        .eq('purpose_hash', purposeHash)
        .single();

      if (error || !consentRecord) {
        return {
          isValid: false,
          error: 'Consent not found'
        };
      }

      // Check expiration
      if (consentRecord.expires_at && new Date() > new Date(consentRecord.expires_at)) {
        // Auto-expire the consent
        await supabaseAdmin
          .from('consent_records')
          .update({ status: 'expired' })
          .eq('id', consentRecord.id);

        return {
          isValid: false,
          status: ConsentStatus.EXPIRED,
          error: 'Consent expired'
        };
      }

      // Check status
      if (consentRecord.status !== 'granted') {
        return {
          isValid: false,
          status: consentRecord.status as ConsentStatus,
          error: `Consent is ${consentRecord.status}`
        };
      }

  	  // Generate ZK proof for verification
  	  const zkProof = await realZKService.generateVerificationProof(
  	    consentRecord.controller_hash,
  	    consentRecord.purpose_hash,
  	    true,
  	    new Date(consentRecord.granted_at).getTime()
  	  );


      // Generate merkle proof from HGTP
      const merkleProof = await realHGTPService.getMerkleProof(consentRecord.id);

      // Create audit log for verification
      await this.createAuditLog({
        consent_id: consentRecord.id,
        user_id: request.userId,
        action: 'consent_verified',
        details: {
          purpose: request.purpose,
          verificationResult: 'valid'
        }
      });

      logger.info('Consent verified successfully', { 
        consentId: consentRecord.id, 
        isValid: true 
      });

      return {
        isValid: true,
        consentId: consentRecord.id,
        zkProof,
        merkleProof,
        status: ConsentStatus.GRANTED
      };

    } catch (error) {
      logger.error('Failed to verify consent', { error, request });
      return {
        isValid: false,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Revoke consent
   */
  async revokeConsent(request: ConsentRevokeRequest, userId: string): Promise<ConsentRevokeResponse> {
    logger.info('Revoking consent via Supabase', { consentId: request.consentId, userId });

    try {
      // Get consent record
      const { data: consentRecord, error } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('id', request.consentId)
        .eq('user_id', userId)
        .single();

      if (error || !consentRecord) {
        throw new Error('Consent not found or access denied');
      }

      if (consentRecord.status !== 'granted') {
        throw new Error(`Cannot revoke consent with status: ${consentRecord.status}`);
      }

      const revokedAt = Date.now();

      // Update consent status
      const { error: updateError } = await supabaseAdmin
        .from('consent_records')
        .update({ 
          status: 'revoked',
          revoked_at: new Date(revokedAt).toISOString()
        })
        .eq('id', request.consentId);

      if (updateError) {
        throw new Error(`Failed to revoke consent: ${updateError.message}`);
      }

      // Update HGTP
      const hgtpResult = await realHGTPService.updateConsentStatus(
        request.consentId, 
        ConsentStatus.REVOKED
      );

      // Update HGTP transaction hash
      await supabaseAdmin
        .from('consent_records')
        .update({ hgtp_tx_hash: hgtpResult.transactionHash })
        .eq('id', request.consentId);

      // Create audit log
      await this.createAuditLog({
        consent_id: request.consentId,
        user_id: userId,
        action: 'consent_revoked',
        details: {
          revokedAt,
          reason: 'user_request'
        },
        hgtp_tx_hash: hgtpResult.transactionHash
      });

      logger.info('Consent revoked successfully', { 
        consentId: request.consentId, 
        hgtpTxHash: hgtpResult.transactionHash 
      });

      return {
        consentId: request.consentId,
        status: ConsentStatus.REVOKED,
        revokedAt,
        hgtpTxHash: hgtpResult.transactionHash
      };

    } catch (error) {
      logger.error('Failed to revoke consent', { error, consentId: request.consentId, userId });
      throw error;
    }
  }

  /**
   * Get user's active consents
   */
  async getActiveConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const { data: consents, error } = await supabaseAdmin
        .from('consent_records')
        .select(`
          *,
          controllers (
            organization_name,
            organization_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'granted')
        .order('granted_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch consents: ${error.message}`);
      }

      return consents || [];
    } catch (error) {
      logger.error('Failed to get active consents', { error, userId });
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(logData: Partial<AuditLogRecord>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          ...logData,
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to create audit log', { error, logData });
      }
    } catch (error) {
      logger.error('Audit log creation error', { error });
    }
  }

  /**
   * Get compliance metrics for a controller
   */
  async getComplianceMetrics(controllerHash: string) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('calculate_compliance_score', { controller_hash_param: controllerHash });

      if (error) {
        throw new Error(`Failed to calculate compliance: ${error.message}`);
      }

      // Get detailed counts
      const { data: counts } = await supabaseAdmin
        .from('consent_records')
        .select('status')
        .eq('controller_hash', controllerHash);

      const totalConsents = counts?.length || 0;
      const activeConsents = counts?.filter(c => c.status === 'granted').length || 0;
      const revokedConsents = counts?.filter(c => c.status === 'revoked').length || 0;
      const expiredConsents = counts?.filter(c => c.status === 'expired').length || 0;

      return {
        controllerHash,
        complianceScore: data || 100,
        totalConsents,
        activeConsents,
        revokedConsents,
        expiredConsents,
        lastAudit: Date.now()
      };
    } catch (error) {
      logger.error('Failed to get compliance metrics', { error, controllerHash });
      throw error;
    }
  }

  /**
   * Build detailed compliance report for a controller
   */
  async getComplianceReport(controllerHash: string) {
    try {
      const { data: controller, error: controllerError } = await supabaseAdmin
        .from('controllers')
        .select('*')
        .eq('controller_hash', controllerHash)
        .single();

      if (controllerError || !controller) {
        throw new Error('Controller not found');
      }

      const metrics = await this.getComplianceMetrics(controllerHash);

      const { data: consents, error: consentError } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('controller_hash', controllerHash)
        .order('granted_at', { ascending: false })
        .limit(200);

      if (consentError) {
        throw new Error(`Failed to load consent records: ${consentError.message}`);
      }

      const { data: auditLogs, error: auditError } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('controller_id', controller.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (auditError) {
        throw new Error(`Failed to load audit logs: ${auditError.message}`);
      }

      const statusCounts = {
        granted: consents?.filter(c => c.status === 'granted').length || 0,
        revoked: consents?.filter(c => c.status === 'revoked').length || 0,
        expired: consents?.filter(c => c.status === 'expired').length || 0
      };

      const recentConsents = (consents || []).slice(0, 25).map(record => ({
        consentId: record.id,
        purpose: record.purpose,
        status: record.status,
        grantedAt: record.granted_at,
        expiresAt: record.expires_at,
        revokedAt: record.revoked_at,
        hgtpTxHash: record.hgtp_tx_hash,
        lawfulBasis: record.lawful_basis,
        dataCategories: record.data_categories
      }));

      const recentAuditLogs = (auditLogs || []).slice(0, 50).map(log => ({
        id: log.id,
        action: log.action,
        consentId: log.consent_id,
        userId: log.user_id,
        details: log.details,
        hgtpTxHash: log.hgtp_tx_hash,
        timestamp: log.created_at
      }));

      return {
        controller: {
          id: controller.id,
          organizationName: controller.organization_name,
          organizationId: controller.organization_id,
          controllerHash: controller.controller_hash,
          createdAt: controller.created_at
        },
        metrics,
        summary: {
          totalConsents: metrics.totalConsents,
          activeConsents: metrics.activeConsents,
          revokedConsents: metrics.revokedConsents,
          expiredConsents: metrics.expiredConsents,
          statusCounts,
          lastUpdated: Date.now()
        },
        recentConsents,
        auditTrail: recentAuditLogs
      };
    } catch (error) {
      logger.error('Failed to build compliance report', { error, controllerHash });
      throw error;
    }
  }
}

export const supabaseConsentService = new SupabaseConsentService();
