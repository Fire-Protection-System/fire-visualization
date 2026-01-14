import { createSlice, ThunkAction } from '@reduxjs/toolkit';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { AnyAction } from 'redux';

import { Configuration } from '../../model/configuration';
import { FireBrigade } from '../model/FireBrigade';
import { ForesterPatrol } from '../model/ForesterPatrol';
import { RootState } from './reduxStore';
import { updateConfiguration } from './mapConfigurationSlice';
import { updateRecommendation } from './recommendationSlice';
import { API_CONFIG, simulationService } from '../services/api';

type serverCommunicationState = {
  isFetching: boolean;
  tickInterval: number;
  currentTick: number | null;
};

let abortController = new AbortController();
const initialState: serverCommunicationState = {
  isFetching: false,
  tickInterval: 5,
  currentTick: null,
};

export const serverCommunicationSlice = createSlice({
  name: 'serverCommunication',
  initialState,
  reducers: {
    abortConnection(state) {
      if (abortController.signal.aborted) {
        return;
      }
      abortController.abort();
      abortController = new AbortController();
      state.isFetching = false;
    },
    setIsFetching(state, action) {
      state.isFetching = action.payload.isFetching;
    },
    setTickInterval(state, action) {
      state.tickInterval = action.payload.tickInterval;
    },
    setCurrentTick(state, action) {
      state.currentTick = action.payload.tick;
    },
  },
});

export type RecommendedAction = {
  unitId: number;
  sectorId: number;
};

export type Recommendation = {
  timestamp: number;
  recommendedActions: RecommendedAction[];
  priority: string;
};

// Throttle function to limit update frequency
let lastUpdateTime = 0;
const THROTTLE_MS = 16; // ~60fps

const throttleUpdate = (callback: () => void) => {
  const now = Date.now();
  if (now - lastUpdateTime >= THROTTLE_MS) {
    lastUpdateTime = now;
    callback();
  } else {
    requestAnimationFrame(() => throttleUpdate(callback));
  }
};

// Optimized data transformation
const transformSectorData = (sector: any) => ({
  sectorId: sector.sectorId,
  state: {
    temperature: sector.state?.temperature ?? 0,
    windSpeed: sector.state?.windSpeed ?? 0,
    windDirection: sector.state?.windDirection ?? 'NE',
    airHumidity: sector.state?.airHumidity ?? 0,
    plantLitterMoisture: sector.state?.plantLitterMoisture ?? 0,
    co2Concentration: sector.state?.co2Concentration ?? 0,
    pm2_5Concentration: sector.state?.pm2_5Concentration ?? 0,
    timestamp: sector.state?.timestamp 
      ? (typeof sector.state.timestamp === 'string'
          ? new Date(sector.state.timestamp).getTime()
          : new Date(sector.state.timestamp).getTime()) 
      : null,
    fireLevel: sector.state?.fireLevel ?? null,
    burnLevel: sector.state?.burnLevel ?? null,
    extinguishLevel: sector.state?.extinguishLevel ?? null,
  },
  contours: sector.contours || [],
  assignedBrigades: sector.assignedBrigades || [],
});

const transformFireBrigadeData = (fb: any) => ({
  fireBrigadeId: fb.fireBrigadeId,
  action: fb.action || 'EXTINGUISH',
  state: fb.state || 'AVAILABLE',
  location: fb.location || { longitude: 0, latitude: 0 },
  sectorId: fb.sectorId || 0,
});

const transformForesterPatrolData = (fp: any) => ({
  foresterPatrolId: fp.foresterPatrolId,
  action: fp.action || 'PATROL',
  state: fp.state || 'AVAILABLE',
  location: fp.location || { longitude: 0, latitude: 0 },
  sectorId: fp.sectorId || 0,
});

export const startFetchingConfigurationUpdate = (): ThunkAction<void, RootState, unknown, AnyAction> => {
  return async (dispatch: any, getState: () => RootState) => {
    const state = getState();
    const { serverCommunication, mapConfiguration } = state;
    if (serverCommunication.isFetching) {
      return;
    }

    const newConfiguration: Configuration = JSON.parse(JSON.stringify(mapConfiguration.configuration));

    newConfiguration.sectors.forEach((sector) => {
      if (sector.assignedBrigades && sector.assignedBrigades.length > 0) {
        sector.assignedBrigades = sector.assignedBrigades.map((b: any) => Number(b));
      }
    });

    dispatch(serverCommunicationSlice.actions.setIsFetching({ isFetching: true }));

    try {
      await simulationService.sendSimulationRequest(newConfiguration);
    } catch (error) {
      console.error('[Simulation] Failed to send simulation request:', error);
      dispatch(serverCommunicationSlice.actions.setIsFetching({ isFetching: false }));
      return;
    }

    const interval = serverCommunication.tickInterval ?? 5;
    const runSimulationUrl = `${API_CONFIG.BACKEND_BASE_URL}${API_CONFIG.ENDPOINTS.SIMULATION.RUN}?interval=${interval}`;
    
    fetchEventSource(runSimulationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfiguration),
      signal: abortController.signal,

      onopen: async (response: Response): Promise<void> => {
        if (!response.ok) {
          console.error('[Simulation] SSE connection failed:', response.status, response.statusText);
        }
      },
      
      onmessage: (event) => {
        try {
          const parsedData = JSON.parse(event.data);

          // Update current tick from backend if present
          if (typeof parsedData.tick === 'number') {
            dispatch(serverCommunicationSlice.actions.setCurrentTick({ tick: parsedData.tick }));
          }

          if (abortController.signal.aborted) {
            return;
          }

          if (parsedData) {
            // Use throttled updates for better performance
            throttleUpdate(() => {
              // Transform backend SimulationStateDto to frontend ConfigurationUpdate format
              const configurationUpdate = {
                forestName: parsedData.forestName || '',
                timestamp: parsedData.timestamp 
                  ? (typeof parsedData.timestamp === 'string' 
                      ? parsedData.timestamp 
                      : new Date(parsedData.timestamp).toISOString()) 
                  : new Date().toISOString(),
                sectors: (parsedData.sectors || []).map(transformSectorData),
                fireBrigades: (parsedData.fireBrigades || []).map(transformFireBrigadeData),
                foresterPatrols: (parsedData.foresterPatrols || []).map(transformForesterPatrolData),
              };
              
              dispatch(updateConfiguration({ configurationUpdate }));
            });
          }
          
          if (parsedData.timestamp && parsedData.recommendedActions) {
            // Transform recommendedActions to match frontend format and preserve unitType/actionType
            const transformedActions = (parsedData.recommendedActions || []).map((action: any) => {
              const unitType: 'fireBrigade' | 'foresterPatrol' | undefined = action.unitType === 'fireBrigade'
                ? 'fireBrigade'
                : action.unitType === 'foresterPatrol'
                  ? 'foresterPatrol'
                  : undefined;

              const unitId = String(action.unitId ?? action.fireBrigadeId ?? '');
              const sectorId = String(action.sectorId ?? '');
              const description = action.actionType
                ? `${action.actionType} unit ${unitId} -> sector ${sectorId}`
                : `Move unit ${unitId} to sector ${sectorId}`;

              return {
                unitId,
                sectorId,
                description,
                unitType,
                actionType: action.actionType,
              };
            });
            
            dispatch(updateRecommendation({
              timestamp: parsedData.timestamp 
                ? (typeof parsedData.timestamp === 'string' 
                    ? parsedData.timestamp 
                    : new Date(parsedData.timestamp).toISOString()) 
                : new Date().toISOString(),
              recommendedActions: transformedActions,
              priority: parsedData.priority || "normal"
            }));
          }

        } catch (parseError) {
          console.error('[Simulation] Failed to parse event data:', parseError, event.data);
        }
      },
      onerror: (error) => {
        console.error('[Simulation] SSE error:', error);
        dispatch(serverCommunicationSlice.actions.setIsFetching({ isFetching: false }));
      },
      onclose: () => {
        console.log('[Simulation] SSE connection closed');
        dispatch(serverCommunicationSlice.actions.setIsFetching({ isFetching: false }));
      }
    });
  }
}

export const sendStopRequest = (): ThunkAction<void, RootState, unknown, AnyAction> => {
   return async (dispatch: any, getState: () => RootState) => {
    const state = getState();
    const { serverCommunication } = state;
    if (serverCommunication.isFetching == false) {
      return;
    }
    dispatch(serverCommunicationSlice.actions.setIsFetching({ isFetching: false }));

    try {
      await simulationService.stopSimulation();
    } catch (error) {
      console.error('[Simulation] Failed to stop simulation:', error);
    }
  }
}

function getRandomIntInclusive(min: number, max: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);

  return Math.random() * (high - low) + low;
}

export const sendBrigadeOrForesterMoveOrder = (unitId: number, targetSectorId: number, type: "brigade"|"forester"): ThunkAction<void, RootState, unknown, AnyAction> => {
  return async (dispatch: any, getState: () => RootState) => {
    const state = getState();
    const { mapConfiguration } = state;

    // Validate input - sector IDs should be positive integers
    if (!targetSectorId || targetSectorId <= 0) {
      console.warn(`[Simulation] Invalid target sector ID: ${targetSectorId}. Sector IDs must be positive integers.`);
      return;
    }

    const targetSector = mapConfiguration.configuration.sectors.find((sector) => sector.sectorId === targetSectorId);

    if (!targetSector) {
      console.warn(`[Simulation] Target sector ${targetSectorId} not found in configuration. Available sectors: ${mapConfiguration.configuration.sectors.map(s => s.sectorId).join(', ')}`);
      return;
    }
    
    // Generate random position within sector bounds
    const getRandomPositionInSector = (contours: number[][]): { longitude: number, latitude: number } => {
      const minLon = Math.min(contours[0][0], contours[1][0], contours[2][0], contours[3][0]);
      const maxLon = Math.max(contours[0][0], contours[1][0], contours[2][0], contours[3][0]);
      const minLat = Math.min(contours[0][1], contours[1][1], contours[2][1], contours[3][1]);
      const maxLat = Math.max(contours[0][1], contours[1][1], contours[2][1], contours[3][1]);
      
      const marginLon = (maxLon - minLon) * 0.1;
      const marginLat = (maxLat - minLat) * 0.1;
      
      return {
        longitude: getRandomIntInclusive(minLon + marginLon, maxLon - marginLon),
        latitude: getRandomIntInclusive(minLat + marginLat, maxLat - marginLat),
      };
    };

    const targetPosition = getRandomPositionInSector(targetSector.contours);

    try {
      const payload = {
        [type == "brigade" ? "fireBrigadeId" : "foresterPatrolId"]: unitId,
        goingToBase: false,
        location: targetPosition,
      };

      if (type === "brigade") {
        await simulationService.orderFireBrigade(payload);
      } else {
        await simulationService.orderForestPatrol(payload);
      }
    } catch (err) {
      console.error(`[Simulation] Failed to order ${type} movement:`, err);
    }
  }
}

export const sendBrigadeOrForesterMoveToBaseOrder = (brigadeID: number, type: "brigade"|"forester"): ThunkAction<void, RootState, unknown, AnyAction> => {
  return async (dispatch: any, getState: () => RootState) => {
    const state = getState();
    const { mapConfiguration } = state;

    let unit:ForesterPatrol|FireBrigade | undefined;

    if(type == "brigade") {
      unit =  mapConfiguration.configuration.fireBrigades.find((fireBrigade) => fireBrigade.fireBrigadeId === brigadeID);
    } else {
      unit =  mapConfiguration.configuration.foresterPatrols.find((foresterPatrol) => foresterPatrol.foresterPatrolId === brigadeID);
    }

    if (!unit) {
      console.warn(`[Simulation] ${type} ${brigadeID} not found`);
      return;
    }

    try {
      const payload = {
        [type == "brigade" ? "fireBrigadeId" : "foresterPatrolId"]: brigadeID,
        goingToBase: true,
        location: {
          longitude: unit.baseLocation.longitude,
          latitude: unit.baseLocation.latitude
        }
      };

      if (type === "brigade") {
        await simulationService.orderFireBrigade(payload);
      } else {
        await simulationService.orderForestPatrol(payload);
      }
    } catch (err) {
      console.error(`[Simulation] Failed to order ${type} return to base:`, err);
    }
  }
}

export const setSimulationSpeed = (tickInterval: number): ThunkAction<void, RootState, unknown, AnyAction> => {
  return async (dispatch: any) => {
    const clamped = Math.max(1, Math.min(30, Math.round(tickInterval)));
    dispatch(serverCommunicationSlice.actions.setTickInterval({ tickInterval: clamped }));

    try {
      await simulationService.setSimulationSpeed(clamped);
    } catch (err) {
      console.error('[Simulation] Failed to set simulation speed:', err);
    }
  };
};

export const {
  abortConnection
} = serverCommunicationSlice.actions;
export const { reducer: serverCommunicationReducer } = serverCommunicationSlice;
