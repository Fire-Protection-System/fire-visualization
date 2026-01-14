import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/reduxStore";
import { Box, Slider, Typography } from "@mui/material";
import { ThunkDispatch } from "@reduxjs/toolkit";
import { AnyAction } from "redux";
import { setSimulationSpeed } from "../../store/serverCommunicationReducers";

export default function FireInformationContainer() {
   const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
   const tickInterval = useSelector((state: RootState) => state.serverCommunication.tickInterval);
   const currentTick = useSelector((state: RootState) => state.serverCommunication.currentTick);

   const handleSpeedChange = (_event: Event, value: number | number[]) => {
      const numeric = Array.isArray(value) ? value[0] : value;
      dispatch(setSimulationSpeed(numeric) as unknown as AnyAction);
   };

   return (
      <Box sx={{ paddingTop: 2, paddingBottom: 2 }}>
         <Typography variant="h6" gutterBottom>
            Simulation speed
         </Typography>
         <Typography variant="body2" color="text.secondary">
            Tick interval: {tickInterval}s
         </Typography>
         <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Current tick: {currentTick ?? '-'}
         </Typography>
         <Slider
            value={tickInterval}
            min={1}
            max={30}
            step={1}
            marks={[
               { value: 1, label: 'Fast' },
               { value: 15, label: 'Medium' },
               { value: 30, label: 'Slow' },
            ]}
            sx={{ maxWidth: 300, mt: 2 }}
            onChange={handleSpeedChange}
         />
      </Box>
   );
}