import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector} from 'react-redux';
import { FormControlLabel, Switch } from '@mui/material';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { RootState } from '../../store/reduxStore';
import { sendBrigadeOrForesterMoveOrder } from '../../store/serverCommunicationReducers'; 

const AutoRecommendationSwitch: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations);
  const mapConfiguration = useSelector((state: RootState) => state.mapConfiguration);

  const sentOrdersRef = useRef<Set<string>>(new Set());

  const allRecommendations = useMemo(() => Object.values(recommendations), [recommendations]);

  const unitTypeMap = useMemo(() => {
    const config = mapConfiguration?.configuration;
    const map = new Map<number, "brigade" | "forester">();
    
    config?.fireBrigades?.forEach((fb: any) => {
      map.set(fb.fireBrigadeId, 'brigade');
    });
    
    config?.foresterPatrols?.forEach((fp: any) => {
      map.set(fp.foresterPatrolId, 'forester');
    });
    
    return map;
  }, [mapConfiguration?.configuration]);

  const handleToggle = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const resetInterval = setInterval(() => {
      sentOrdersRef.current.clear();
    }, 100);

    for (const action of allRecommendations) {
      if (action.unitId !== undefined && action.sectorId !== undefined) {
        // Handle both string and number unitIds
        const unitIdStr = String(action.unitId).trim();
        const unitId = Number(unitIdStr);
        const sectorId = Number(action.sectorId);
        
        // Validate that both IDs are positive integers and unitId is a valid number
        if (isNaN(unitId) || isNaN(sectorId) || unitId <= 0 || sectorId <= 0) {
          console.warn(`[AutoRecommendationSwitch] Invalid recommendation: unitId=${action.unitId}, sectorId=${action.sectorId}. Skipping.`);
          continue;
        }
        
        const orderKey = `${unitId}-${sectorId}`;
  
        if (!sentOrdersRef.current.has(orderKey)) {
          // Derive unit type: prefer explicit unitType from recommendation, fallback to config map
          let unitType: "brigade" | "forester" | undefined;
          if (action.unitType === 'fireBrigade') {
            unitType = 'brigade';
          } else if (action.unitType === 'foresterPatrol') {
            unitType = 'forester';
          } else {
            unitType = unitTypeMap.get(unitId);
          }

          // Skip if unitId doesn't match any known unit
          if (!unitType) {
            const availableIds = Array.from(unitTypeMap.keys()).join(', ');
            console.warn(`[AutoRecommendationSwitch] Unit ID ${unitId} not found in configuration. Available IDs: [${availableIds}]. Skipping recommendation.`);
            continue;
          }
          
          sentOrdersRef.current.add(orderKey);

          console.log(`[AutoRecommendationSwitch] Applying recommendation: ${unitType} ${unitId} -> sector ${sectorId}`);
          dispatch(
            sendBrigadeOrForesterMoveOrder(
              unitId,
              sectorId,
              unitType
            )
          );
        }
      }
    }
    
    return () => clearInterval(resetInterval);
  }, [enabled, allRecommendations, dispatch, unitTypeMap]);

  return (
    <FormControlLabel
      control={<Switch checked={enabled} onChange={handleToggle} />}
      label="Auto-apply recommendations"
    />
  );
};

export default AutoRecommendationSwitch;
