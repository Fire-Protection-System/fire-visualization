import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector} from 'react-redux';
import { FormControlLabel, Switch } from '@mui/material';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { RootState } from '../../store/reduxStore';
import { sendBrigadeOrForesterMoveOrder } from '../../store/serverCommunicationReducers';
import { addLog } from '../../store/logsSlice';
import { agentPositionController } from '../../features/maps/AgentPositionController';

// Global kill-switch: when false, frontend will NOT auto-send any recommendations.
const AUTO_RECOMMENDATION_FEATURE_ENABLED = false;

const AutoRecommendationSwitch: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations);
  const mapConfiguration = useSelector((state: RootState) => state.mapConfiguration);
  const lastAppliedSectorsRef = useRef<Record<string, number>>({});
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

  const validSectorIds = useMemo(() => {
    const config = mapConfiguration?.configuration;
    return new Set((config?.sectors || []).map((s: any) => s.sectorId));
  }, [mapConfiguration?.configuration]);

  // Backend recommendation timestamp - process recommendations once per new timestamp
  const recommendationTimestamp = useSelector((state: RootState) => state.recommendation.timestamp);
  const lastProcessedRecommendationTimestampRef = useRef<string | null>(null);
  const MAX_RECOMMENDATIONS_PER_UPDATE = 1; // send at most 1 recommendation per backend update


  const handleToggle = useCallback(() => {
    setEnabled(prev => {
      const newState = !prev;
      // Clear history when disabling or enabling to ensure fresh state if re-enabled
      if (!newState) {
        lastAppliedSectorsRef.current = {};
      }
      return newState;
    });
  }, []);

  useEffect(() => {
    // When enabled, process incoming recommendation updates once per backend recommendation timestamp
    // and send up to MAX_RECOMMENDATIONS_PER_UPDATE recommendations (spaced to avoid throttle).
    const SEND_DELAY_MS = 600;
    const pendingTimeoutsRef: number[] = [];

    // Hard-disable feature globally if flag is false
    if (!AUTO_RECOMMENDATION_FEATURE_ENABLED) {
      pendingTimeoutsRef.forEach(clearTimeout);
      return;
    }

    if (!enabled) {
      // clear any pending timers if disabled
      pendingTimeoutsRef.forEach(clearTimeout);
      return;
    }

    // Only proceed when a new recommendation timestamp arrives
    if (!recommendationTimestamp) return;
    if (lastProcessedRecommendationTimestampRef.current === recommendationTimestamp) return;

    // mark this timestamp as processed
    lastProcessedRecommendationTimestampRef.current = recommendationTimestamp;

    // Debounce processing so rapid incoming recommendation updates don't spawn flurries
    const debounceId = window.setTimeout(() => {
      const toSchedule: Array<{ unitId: number; sectorId: number; unitType: "brigade" | "forester"; unitKey: string; }> = [];

      for (const action of allRecommendations) {
        if (action.unitId === undefined || action.sectorId === undefined) continue;

        const unitId = Number(action.unitId);
        const sectorId = Number(action.sectorId);
        if (isNaN(unitId) || isNaN(sectorId) || unitId <= 0 || sectorId <= 0) continue;
        if (!validSectorIds.has(sectorId)) continue;

        let unitType: "brigade" | "forester" | undefined;
        if (action.unitType === 'fireBrigade') {
          unitType = 'brigade';
        } else if (action.unitType === 'foresterPatrol') {
          unitType = 'forester';
        } else {
          unitType = unitTypeMap.get(unitId);
        }

        if (!unitType) continue;

        const unitKey = `${unitType}:${unitId}`;
        const lastSectorId = lastAppliedSectorsRef.current[unitKey];

        // Only schedule if this recommendation would change last applied sector
        if (lastSectorId !== sectorId) {
          toSchedule.push({ unitId, sectorId, unitType, unitKey });
        } else {
          // Already applied - log for debugging
          try {
            dispatch(addLog({ text: `[Auto-Apply] Skipping ${unitType}:${unitId} -> sector ${sectorId} (already applied)`, source: 'simulation', level: 'info' }));
          } catch (e) {
            // ignore logging errors
          }
        }
      }

      // Limit to at most MAX_RECOMMENDATIONS_PER_UPDATE per backend update
      const limited = toSchedule.slice(0, MAX_RECOMMENDATIONS_PER_UPDATE);

      // Schedule sequential dispatches spaced by SEND_DELAY_MS
      limited.forEach((item, index) => {
        const delay = index * SEND_DELAY_MS;
        const t = window.setTimeout(() => {
          // mark as applied immediately to avoid duplicate scheduling
          lastAppliedSectorsRef.current[item.unitKey] = item.sectorId;

          // Get approximate current position from fast agent controller for logs
          let posText = 'unknown';
          try {
            const p = agentPositionController.getPosition(item.unitId, item.unitType === 'brigade' ? 'fireBrigade' : 'foresterPatrol');
            if (p && typeof p.lng === 'number' && typeof p.lat === 'number') posText = `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`;
          } catch (e) {
            // ignore position read errors
          }

          const logText = `[Auto-Apply] Dispatching auto order: ${item.unitType}:${item.unitId} -> sector ${item.sectorId} | currentPos: ${posText}`;
          console.debug('[AutoRecommendation] Dispatching scheduled action', item);
          dispatch(addLog({ text: logText, source: 'simulation', level: 'info' }));

          dispatch(
            sendBrigadeOrForesterMoveOrder(
              item.unitId,
              item.sectorId,
              item.unitType,
              'auto'
            )
          );
        }, delay);
        pendingTimeoutsRef.push(t);
      });
    }, 200);

    return () => {
      clearTimeout(debounceId);
      pendingTimeoutsRef.forEach(clearTimeout);
    };
  }, [enabled, recommendationTimestamp, allRecommendations, dispatch, unitTypeMap, validSectorIds]);

  return (
    <FormControlLabel
      control={
        <Switch
          checked={enabled && AUTO_RECOMMENDATION_FEATURE_ENABLED}
          onChange={handleToggle}
          disabled={!AUTO_RECOMMENDATION_FEATURE_ENABLED}
        />
      }
      label="Auto-apply recommendations"
    />
  );
};

export default AutoRecommendationSwitch;
