import { Button } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/reduxStore';
import { ConfigurationUpdate, isDefaultConfiguration } from '../../model/configuration';
import { updateConfiguration } from '../../store/mapConfigurationSlice';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useNavigate } from 'react-router-dom';
import { abortConnection, startFetchingConfigurationUpdate } from '../../store/serverCommunicationReducers';
import { UnknownAction } from '@reduxjs/toolkit';

//probably something here is used instead of stop simulation button
export const RunSimulationButton = () => {
  const { configuration: mapConfiguration } = useSelector((state: RootState) => state.mapConfiguration);
  const dispatch: AppDispatch = useDispatch();

  const navigate = useNavigate();  

  const ctrl = useRef<AbortController>(new AbortController());

  const fetchConfigurationUpdate = useCallback(() => {

    dispatch(startFetchingConfigurationUpdate())
    
    
  }, [dispatch, mapConfiguration]);

  const startSimulation = useCallback(() => {       
    navigate('/simulation');
    fetchConfigurationUpdate();

   

  }, []);



  return (
    <Button
      variant="contained"
      onClick={() => {
        startSimulation();        
      }}
      sx={{ width: '150px' }}
      disabled={isDefaultConfiguration(mapConfiguration)}
    >
      Run simulation
    </Button>
  );
};



// export const RunSimulationButton1 = () => {
//   const { configuration: mapConfiguration } = useSelector((state: RootState) => state.mapConfiguration);
//   const dispatch = useDispatch();

//   const [isRunning, setIsRunning] = useState<boolean>(false);

//   const ctrl = useRef<AbortController>(new AbortController());

//   const fetchConfigurationUpdate = useCallback(() => {
//     fetchEventSource(`http://localhost:8181/run-simulation?interval=${5}`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(mapConfiguration),
//       signal: ctrl.current.signal,

//       onmessage: (event) => {        
//         const newState = JSON.parse(event.data) as ConfigurationUpdate;
//         if(ctrl.current.signal.aborted) {
//           return;
//         }
//         dispatch(updateConfiguration({ configurationUpdate: newState })); // TODO use timestamp that is being sent
//       },
//       onerror: (event) => {
//         setIsRunning(false);
//       },
//       onclose: () => {
//       },
//     });
//   }, [dispatch, mapConfiguration]);

  

//   return !isRunning ? (
//     <Button
//       variant="contained"
//       onClick={() => {
//         fetchConfigurationUpdate();
//         setIsRunning(true);
//       }}
//       sx={{ width: '150px' }}
//       disabled={isDefaultConfiguration(mapConfiguration)}
//     >
//       Run simulation
//     </Button>
//   ) : (
//     <Button
//       variant="contained"
//       color="error"
//       onClick={() => {
//         ctrl.current.abort();
//         setIsRunning(false);
//       }}
//       sx={{ width: '150px' }}
//     >
//       Stop simulation
//     </Button>
//   );
// };
