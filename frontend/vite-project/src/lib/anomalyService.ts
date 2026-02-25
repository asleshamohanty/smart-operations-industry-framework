import { supabase } from './supabase';

export interface Anomaly {
  id?: number;
  anomaly_id: string;
  sensor_name: string;
  sensor_type: string;
  location: string;
  timestamp: string;
  value: number;
  unit: string;
  normal_range_min: number;
  normal_range_max: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  project_id?: number;
  deviation_amount?: number;
  deviation_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AnomalyCreate {
  anomaly_id: string;
  sensor_name: string;
  sensor_type: string;
  location: string;
  value: number;
  unit: string;
  normal_range_min: number;
  normal_range_max: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  project_id?: number;
  deviation_amount?: number;
  deviation_percentage?: number;
}

export interface AnomalyUpdate {
  resolved?: boolean;
  resolved_by?: string;
  description?: string;
}

export interface AnomalyStats {
  total_anomalies: number;
  resolved_anomalies: number;
  unresolved_anomalies: number;
  severity_breakdown: Record<string, number>;
  timestamp: string;
}

class AnomalyService {
  /**
   * Create a new anomaly record
   */
  async createAnomaly(anomaly: AnomalyCreate): Promise<Anomaly> {
    try {
      const { data, error } = await supabase
        .from('anomalies')
        .insert({
          anomaly_id: anomaly.anomaly_id,
          sensor_name: anomaly.sensor_name,
          sensor_type: anomaly.sensor_type,
          location: anomaly.location,
          value: anomaly.value,
          unit: anomaly.unit,
          normal_range_min: anomaly.normal_range_min,
          normal_range_max: anomaly.normal_range_max,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          description: anomaly.description,
          project_id: anomaly.project_id,
          deviation_amount: anomaly.deviation_amount,
          deviation_percentage: anomaly.deviation_percentage,
          resolved: false
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create anomaly: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating anomaly:', error);
      throw error;
    }
  }

  /**
   * Get anomalies with optional filtering
   */
  async getAnomalies(options: {
    limit?: number;
    offset?: number;
    severity?: string;
    resolved?: boolean;
    project_id?: number;
    sensor_name?: string;
  } = {}): Promise<Anomaly[]> {
    try {
      const {
        limit = 100,
        offset = 0,
        severity,
        resolved,
        project_id,
        sensor_name
      } = options;

      let query = supabase
        .from('anomalies')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (severity) {
        query = query.eq('severity', severity);
      }
      if (resolved !== undefined) {
        query = query.eq('resolved', resolved);
      }
      if (project_id) {
        query = query.eq('project_id', project_id);
      }
      if (sensor_name) {
        query = query.eq('sensor_name', sensor_name);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch anomalies: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      throw error;
    }
  }

  /**
   * Get a specific anomaly by anomaly_id
   */
  async getAnomaly(anomalyId: string): Promise<Anomaly | null> {
    try {
      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .eq('anomaly_id', anomalyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch anomaly: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching anomaly:', error);
      throw error;
    }
  }

  /**
   * Update an anomaly
   */
  async updateAnomaly(anomalyId: string, updates: AnomalyUpdate): Promise<Anomaly> {
    try {
      const updateData: any = { ...updates };
      
      // Handle resolved status
      if (updates.resolved !== undefined) {
        if (updates.resolved) {
          updateData.resolved_at = new Date().toISOString();
        } else {
          updateData.resolved_at = null;
        }
      }

      const { data, error } = await supabase
        .from('anomalies')
        .update(updateData)
        .eq('anomaly_id', anomalyId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update anomaly: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating anomaly:', error);
      throw error;
    }
  }

  /**
   * Delete an anomaly
   */
  async deleteAnomaly(anomalyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('anomalies')
        .delete()
        .eq('anomaly_id', anomalyId);

      if (error) {
        throw new Error(`Failed to delete anomaly: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting anomaly:', error);
      throw error;
    }
  }

  /**
   * Get anomaly statistics summary
   */
  async getAnomalyStats(): Promise<AnomalyStats> {
    try {
      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('anomalies')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw new Error(`Failed to get total count: ${totalError.message}`);
      }

      // Get resolved count
      const { count: resolvedCount, error: resolvedError } = await supabase
        .from('anomalies')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', true);

      if (resolvedError) {
        throw new Error(`Failed to get resolved count: ${resolvedError.message}`);
      }

      // Get unresolved count
      const { count: unresolvedCount, error: unresolvedError } = await supabase
        .from('anomalies')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);

      if (unresolvedError) {
        throw new Error(`Failed to get unresolved count: ${unresolvedError.message}`);
      }

      // Get severity breakdown
      const { data: severityData, error: severityError } = await supabase
        .from('anomalies')
        .select('severity');

      if (severityError) {
        throw new Error(`Failed to get severity data: ${severityError.message}`);
      }

      const severityBreakdown: Record<string, number> = {};
      severityData?.forEach(anomaly => {
        const severity = anomaly.severity;
        severityBreakdown[severity] = (severityBreakdown[severity] || 0) + 1;
      });

      return {
        total_anomalies: totalCount || 0,
        resolved_anomalies: resolvedCount || 0,
        unresolved_anomalies: unresolvedCount || 0,
        severity_breakdown: severityBreakdown,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching anomaly stats:', error);
      throw error;
    }
  }

  /**
   * Get recent anomalies within specified hours
   */
  async getRecentAnomalies(hours: number = 24, limit: number = 50): Promise<Anomaly[]> {
    try {
      const threshold = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();

      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .gte('timestamp', threshold)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent anomalies: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent anomalies:', error);
      throw error;
    }
  }

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(anomalyId: string, resolvedBy?: string): Promise<Anomaly> {
    return this.updateAnomaly(anomalyId, {
      resolved: true,
      resolved_by: resolvedBy || 'System'
    });
  }

  /**
   * Unresolve an anomaly
   */
  async unresolveAnomaly(anomalyId: string): Promise<Anomaly> {
    return this.updateAnomaly(anomalyId, {
      resolved: false,
      resolved_by: null
    });
  }
}

export const anomalyService = new AnomalyService();
