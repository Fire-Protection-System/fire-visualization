/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

const getBackendUrl = (): string => {
  // Check for environment variable first (from webpack DefinePlugin)
  // In browser, process.env is replaced by webpack DefinePlugin at build time
  const envUrl = typeof process !== 'undefined' && process.env?.FIRE_BACKEND_SERVICE
    ? process.env.FIRE_BACKEND_SERVICE
    : '';
  
  if (envUrl) {
    // If it's just a hostname (from docker-compose), add protocol and port
    if (!envUrl.startsWith('http')) {
      return `http://${envUrl}:8181`;
    }
    return envUrl;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:8181';
};

const getConfigurationServiceUrl = (): string => {
  const envUrl = typeof process !== 'undefined' && process.env?.FIRE_CONFIGURATION_SERVICE
    ? process.env.FIRE_CONFIGURATION_SERVICE
    : '';
  
  if (envUrl) {
    if (!envUrl.startsWith('http')) {
      return `http://${envUrl}:31415`;
    }
    return envUrl;
  }
  
  return 'http://localhost:31415';
};

export const API_CONFIG = {
  BACKEND_BASE_URL: getBackendUrl(),
  CONFIGURATION_BASE_URL: getConfigurationServiceUrl(),
  ENDPOINTS: {
    // Simulation endpoints
    SIMULATION: {
      SEND_REQUEST: '/simulation/send-simulation-request',
      RUN: '/simulation/run-simulation',
      STOP: '/simulation/stop-simulation',
      SET_SPEED: '/simulation/set-speed',
      ORDER_FIRE_BRIGADE: '/simulation/orderFireBrigade',
      ORDER_FOREST_PATROL: '/simulation/orderForestPatrol',
      ASSIGN_BRIGADES: '/simulation/assignBrigades',
    },
    // Configuration service endpoints
    CONFIGURATION: {
      NODES: '/api/v1/nodes',
      NODE_BY_ID: (id: string) => `/api/v1/nodes/${id}`,
      NODE_CHILDREN: (id: string) => `/api/v1/nodes/${id}/children`,
    },
  },
} as const;
