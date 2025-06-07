import { createSlice, ThunkAction } from '@reduxjs/toolkit';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { AnyAction } from 'redux';

import { Configuration } from '../../model/configuration/configuration';
import { FireBrigade } from '../../model/FireBrigade';
import { ForesterPatrol } from '../../model/ForesterPatrol';
import { RootState } from '../reduxStore';
import { updateConfiguration } from './mapConfigurationSlice';
import { updateRecommendation } from './recommendationSlice';

type serverCommunicationState = {
  // abortController: AbortController;
  isFetching: boolean;
};

let abortController = new AbortController();
const initialState: serverCommunicationState = {
  // abortController: new AbortController(),
  isFetching: false,
};

export const serverCommunicationSlice = createSlice({
  name: 'serverCommunication',
  initialState,
  reducers: {
    abortConnection(state) {
      // state.abortController.abort();
      // state.abortController = new AbortController();
      if (abortController.signal.aborted) {
        return;
      }
      abortController.abort();
      abortController = new AbortController();
      state.isFetching = false;
    },
    setIsFetching(state, action) {
      state.isFetching = action.payload.isFetching;
    }
  },
});

<<<<<<< HEAD
export type RecommendedAction = {
  unitId: number;
  sectorId: number;
};

export type Recommendation = {
  timestamp: number;
  recommendedActions: RecommendedAction[];
  priority: string;
};

=======
>>>>>>> origin/main
export const startFetchingConfigurationUpdate = (): ThunkAction<void, RootState, unknown, AnyAction> => {
  return async (dispatch: any, getState: () => RootState) => {
    const state = getState();
    const { serverCommunication, mapConfiguration } = state;
    if (serverCommunication.isFetching) {
      return;
    }

    // console.log(mapConfiguration.configuration);

    const newConfiguration: Configuration = JSON.parse(JSON.stringify(mapConfiguration.configuration));

    newConfiguration.sectors.forEach((sector) => {
      sector.row -= 1;
      sector.column -= 1;
    });

    // const newConfiguration = mapConfiguration.configuration;

    // serverCommunication.isFetching = true;
    dispatch(serverCommunicationSlice.actions.setIsFetching({ isFetching: true }));

    await fetch(`http://localhost:8181/send-simulation-request`, {      
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfiguration),      
    });

    fetchEventSource(`http://localhost:8181/run-simulation?interval=${1}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfiguration),
      signal: abortController.signal,
<<<<<<< HEAD

      onopen: async (response: Response): Promise<void> => {
        console.log("SSE connection opened successfully");
      },
      
      onmessage: (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log('Event parsed successfully:', parsedData);

=======
      onopen: () => {
        console.log("SSE connection opened successfully");
      },
      onmessage: (event) => {
        console.log('Raw event data:', event.data);
        try {
          const newState = JSON.parse(event.data) as ConfigurationUpdate;
          console.log('Event parsed successfully:', newState);
>>>>>>> origin/main
          if (abortController.signal.aborted) {
            console.log("Aborted");
            return;
          }
<<<<<<< HEAD

          if (parsedData) {
            console.log("update config");
            dispatch(updateConfiguration({ configurationUpdate: parsedData }));
          }
          
          if (parsedData.timestamp && parsedData.recommendedActions) {
            dispatch(updateRecommendation({
              timestamp: parsedData.timestamp,
              recommendedActions: parsedData.recommendedActions,
              priority: parsedData.priority || "normal"
            }));
          }

=======
          dispatch(updateConfiguration({ configurationUpdate: newState }));
>>>>>>> origin/main
        } catch (parseError) {
          console.error('Error parsing event data:', parseError, 'Raw data:', event.data);
        }
      },
      onerror: (error) => {
        console.error('SSE Error:', error);
      },
      onclose: () => {
        console.log('Event source closed');
      }
    });
  }
}

export const sendStopRequest = (): ThunkAction<void, RootState, unknown, AnyAction> => {
   return async (dispatch: any, getState: () => RootState) => {
    const state = getState();
    const { serverCommunication, mapConfiguration } = state;
    if (serverCommunication.isFetching == false) {
      return;
    }
    dispatch(serverCommunicationSlice.actions.setIsFetching({ isFetching: false }));

    await fetch(`http://localhost:8181/stop-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: "",
    });
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

    const targetSector = mapConfiguration.configuration.sectors.find((sector) => sector.sectorId === targetSectorId);

    if (!targetSector) {
      console.error("Target sector not found");
      return;
    }
    // (point1[0] + point2[0]) / 2
    const calculateMidpoint = (point1: number[], point2: number[]): { longitude: number, latitude: number } => {
      // console.log(Decimal.add(0.1, 0.2).toNumber());

      // ### PREV SOLUTION ###
      // return {
      //   longitude: Decimal.add(point1[0], point2[0]).dividedBy(2).toNumber(),
      //   latitude:  Decimal.add(point1[1], point2[1]).dividedBy(2).toNumber()
      // };
      // ### PREV SOLUTION ###

      return {
        longitude:  getRandomIntInclusive(point1[0], point2[0]),
        latitude:   getRandomIntInclusive(point1[1], point2[1])
      }

      // return {
      //   longitude: point1[0], //lewy dolny
      //   latitude:  point1[1]
      // };
      // return {
      //   longitude: point2[0], //lewy górny
      //   latitude:  point2[1]
      // };
    };

    console.log(targetSector.contours);
    const midpoint = calculateMidpoint(targetSector.contours[0], targetSector.contours[2]);

    const url = type == "brigade" ? "http://localhost:8181/orderFireBrigade" : "http://localhost:8181/orderForestPatrol";

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [type == "brigade"?"fireBrigadeId": "forestPatrolId"]: unitId,
        goingToBase: false,
        location: midpoint
      }),
    })
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
      console.error("Brigade not found");
      return;
    }

    const url = type == "brigade" ? "http://localhost:8181/orderFireBrigade" : "http://localhost:8181/orderForestPatrol";

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [type == "brigade"?"fireBrigadeId": "forestPatrolId"]: brigadeID,
        goingToBase: true,
        location: {
          longitude: unit.baseLocation.longitude,
          latitude: unit.baseLocation.latitude
        }
      }),
    })
  }
}

export const {
  abortConnection
} = serverCommunicationSlice.actions;
export const { reducer: serverCommunicationReducer } = serverCommunicationSlice;
