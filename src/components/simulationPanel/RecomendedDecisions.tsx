import { Box, Divider, Typography, List, ListItem, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { RootState } from '../../store/reduxStore';
import { sendBrigadeOrForesterMoveOrder } from "../../store/serverCommunicationReducers";

const RecommendedDecisions = () => {
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations);
  const mapConfiguration = useSelector((state: RootState) => state.mapConfiguration);
  const allRecommendations = Object.values(recommendations);

  if (allRecommendations.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body1" color="text.secondary">
          No recommendations available at this time.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Divider sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Recommended Actions
        </Typography>
      </Divider>

      <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {allRecommendations.map((action, index) => (
          <ListItem
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <Typography variant="body1">
              Send unit {action.unitId} to sector {action.sectorId}
            </Typography>
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() => {
                const config = mapConfiguration?.configuration;
                const unitId = Number(action.unitId);
                const sectorId = Number(action.sectorId);
                
                // Validate inputs
                if (!unitId || unitId <= 0 || !sectorId || sectorId <= 0) {
                  console.warn(`[RecommendedDecisions] Invalid recommendation: unitId=${unitId}, sectorId=${sectorId}`);
                  return;
                }
                
                // Determine if unitId is a fire brigade or forester patrol
                const isFireBrigade = config?.fireBrigades?.some((fb: any) => fb.fireBrigadeId === unitId);
                const isForester = config?.foresterPatrols?.some((fp: any) => fp.foresterPatrolId === unitId);
                
                // Skip if unitId doesn't match any known unit
                if (!isFireBrigade && !isForester) {
                  console.warn(`[RecommendedDecisions] Unit ID ${unitId} not found in configuration. Skipping recommendation.`);
                  return;
                }
                
                const unitType = isFireBrigade ? 'brigade' : 'forester';
                
                dispatch(
                  sendBrigadeOrForesterMoveOrder(
                    unitId, 
                    sectorId, 
                    unitType as "brigade" | "forester"
                  ));
              }}
            >
              Apply
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RecommendedDecisions;
