/**
 * Supabase-backed Controller (Organization) Service
 */

import { supabaseAdmin } from '../config/supabase';
import {
  ControllerRegistrationRequest,
  ControllerRegistrationResponse
} from '@consentire/shared';
import { generateControllerHash } from '../utils/crypto';
import { logger } from '../utils/logger';

class SupabaseControllerService {
  /**
   * Register a new controller (organization)
   */
  async registerController(request: ControllerRegistrationRequest, creatorUserId: string): Promise<ControllerRegistrationResponse> {
    try {
      const controllerHash = generateControllerHash(request.organizationId);

      // Upsert controller by unique organization_id
      const { data, error } = await supabaseAdmin
        .from('controllers')
        .upsert({
          organization_name: request.organizationName,
          organization_id: request.organizationId,
          controller_hash: controllerHash,
          public_key: request.publicKey,
          metadata: request.metadata || {}
        }, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to register controller');
      }

      logger.info('Controller registered (Supabase)', { id: data.id, controllerHash });

      return {
        controllerId: data.id, // UUID from DB
        controllerHash,
        registeredAt: Date.now()
      };
    } catch (error) {
      logger.error('registerController failed', { error, request });
      throw error;
    }
  }

  /**
   * Get controller info by DB id (UUID)
   */
  async getController(controllerId: string) {
    const { data, error } = await supabaseAdmin
      .from('controllers')
      .select('*')
      .eq('id', controllerId)
      .single();

    if (error) throw error;
    return data;
  }
}

export const supabaseControllerService = new SupabaseControllerService();

