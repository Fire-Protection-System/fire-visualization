import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector} from 'react-redux';
import { FormControlLabel, Switch } from '@mui/material';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { RootState } from '././../../store/reduxStore';
import { sendBrigadeOrForesterMoveOrder }  from '../../store/serverCommunicationReducers'; 

const AutoRecommendationSwitch: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations);
  const mapConfiguration = useSelector((state: RootState) => state.mapConfiguration);

  const sentOrdersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const resetInterval = setInterval(() => {
        sentOrdersRef.current.clear();
    }, 100);
  
    const allRecommendations = Object.values(recommendations);

    const config = mapConfiguration?.configuration;
    
    for (const action of allRecommendations) {
      if (action.unitId !== undefined && action.sectorId !== undefined) {
        const orderKey = `${action.unitId}-${action.sectorId}`;
  
        if (!sentOrdersRef.current.has(orderKey)) {
          sentOrdersRef.current.add(orderKey);

          const unitId = Number(action.unitId);
          const sectorId = Number(action.sectorId);
          
          // Validate inputs
          if (unitId <= 0 || sectorId <= 0) {
            console.warn(`[RunAutoSimulationSwitch] Invalid recommendation: unitId=${unitId}, sectorId=${sectorId}`);
            continue;
          }
          
          // Determine if unitId is a fire brigade or forester patrol
          const isFireBrigade = config?.fireBrigades?.some((fb: any) => fb.fireBrigadeId === unitId);
          const isForester = config?.foresterPatrols?.some((fp: any) => fp.foresterPatrolId === unitId);
          
          // Skip if unitId doesn't match any known unit
          if (!isFireBrigade && !isForester) {
            console.warn(`[RunAutoSimulationSwitch] Unit ID ${unitId} not found in configuration. Skipping recommendation.`);
            continue;
          }
          
          const unitType = isFireBrigade ? 'brigade' : 'forester';

          dispatch(
            sendBrigadeOrForesterMoveOrder(
              unitId,
              sectorId,
              unitType as "brigade" | "forester"
            )
          );
        }
      }
    }
    return () => clearInterval(resetInterval);
  }, [enabled, recommendations, dispatch]);

  return (
    <FormControlLabel
      control={<Switch checked={enabled} onChange={() => setEnabled(!enabled)} />}
      label="Auto-apply recommendations"
    />
  );
};

export default AutoRecommendationSwitch;