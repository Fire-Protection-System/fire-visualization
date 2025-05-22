import { Box, Divider, Typography, List, ListItem, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { RootState } from '../../store/reduxStore';
import { sendBrigadeOrForesterMoveOrder } from "../../store/reducers/serverCommunicationReducers";

const RecommendedDecisions = () => {
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations);
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
              Send brigade {action.unitId} to sector {action.sectorId}
            </Typography>
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() =>
                dispatch(
                  sendBrigadeOrForesterMoveOrder(
                    Number(action.unitId), 
                    Number(action.sectorId), 
                    'brigade'
                  ))
              }
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
