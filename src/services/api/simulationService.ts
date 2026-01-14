/**
 * Simulation Service API
 * Handles all simulation-related API calls
 */

import { httpClient } from './httpClient';
import { API_CONFIG } from './config';
import { Configuration } from '../../model/configuration';

const baseUrl = API_CONFIG.BACKEND_BASE_URL;

export interface SimulationOrder {
  fireBrigadeId?: number;
  foresterPatrolId?: number;
  goingToBase: boolean;
  location: {
    longitude: number;
    latitude: number;
  };
}

export const simulationService = {
  /**
   * Send simulation request
   */
  sendSimulationRequest: async (configuration: Configuration): Promise<void> => {
    await httpClient.post(
      `${baseUrl}${API_CONFIG.ENDPOINTS.SIMULATION.SEND_REQUEST}`,
      configuration
    );
  },

  /**
   * Stop simulation
   */
  stopSimulation: async (): Promise<void> => {
    await httpClient.post(
      `${baseUrl}${API_CONFIG.ENDPOINTS.SIMULATION.STOP}`,
      {}
    );
  },

  /**
   * Set simulation speed
   */
  setSimulationSpeed: async (tickInterval: number): Promise<void> => {
    const clamped = Math.max(1, Math.min(30, Math.round(tickInterval)));
    await httpClient.post(
      `${baseUrl}${API_CONFIG.ENDPOINTS.SIMULATION.SET_SPEED}?tickInterval=${clamped}`,
      { tickInterval: clamped }
    );
  },

  /**
   * Order fire brigade movement
   */
  orderFireBrigade: async (order: SimulationOrder): Promise<void> => {
    await httpClient.post(
      `${baseUrl}${API_CONFIG.ENDPOINTS.SIMULATION.ORDER_FIRE_BRIGADE}`,
      order
    );
  },

  /**
   * Order forest patrol movement
   */
  orderForestPatrol: async (order: SimulationOrder): Promise<void> => {
    await httpClient.post(
      `${baseUrl}${API_CONFIG.ENDPOINTS.SIMULATION.ORDER_FOREST_PATROL}`,
      order
    );
  },

  /**
   * Assign brigades to sectors
   */
  assignBrigades: async (data: unknown): Promise<void> => {
    await httpClient.post(
      `${baseUrl}${API_CONFIG.ENDPOINTS.SIMULATION.ASSIGN_BRIGADES}`,
      data
    );
  },
};
