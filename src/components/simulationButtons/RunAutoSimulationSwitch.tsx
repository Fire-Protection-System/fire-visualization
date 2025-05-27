import { useState, useEffect } from 'react';
import { useDispatch, useSelector} from 'react-redux';
import { FormControlLabel, Switch } from '@mui/material';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { RootState } from '././../../store/reduxStore';
import { sendBrigadeOrForesterMoveOrder }  from '././../../store/reducers/serverCommunicationReducers'; // Fixed import

const AutoRecommendationSwitch: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const recommendations = useSelector((state: RootState) => state.recommendation.recommendations);

  useEffect(() => {
    if (!enabled) return;
    const allRecommendations = Object.values(recommendations);

    for (const action of allRecommendations) {
      if (action.unitId !== undefined && action.sectorId !== undefined) {
        dispatch(
          sendBrigadeOrForesterMoveOrder(
            Number(action.unitId), 
            Number(action.sectorId), 
            'brigade'
          ));
      } 
    }
  }, [enabled, recommendations, dispatch]);

  return (
    <FormControlLabel
      control={<Switch checked={enabled} onChange={() => setEnabled(!enabled)} />}
      label="Auto-apply recommendations"
    />
  );
};

export default AutoRecommendationSwitch;