import { Button } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/reduxStore';
import { ConfigurationUpdate, isDefaultConfiguration } from '../../model/configuration';
import { updateConfiguration } from '../../store/mapConfigurationSlice';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useNavigate } from 'react-router-dom';
import { abortConnection, sendStopRequest } from '../../store/serverCommunicationReducers';

//this button probably isn't even used, nor stopSimulation is
export const StopSimulationButton = () => {
  const { configuration: mapConfiguration } = useSelector((state: RootState) => state.mapConfiguration);
  const dispatch: AppDispatch = useDispatch();
  
  const navigate = useNavigate();  

  const stopSimulation = useCallback(() => {
     dispatch(sendStopRequest());
   navigate('/');
   dispatch(abortConnection())

  }, []);



  return (
    <Button
      variant="contained"
      color='error'
      onClick={() => {
        stopSimulation();        
      }}
      sx={{ width: '150px' }}      
    >
      Stop simulation
    </Button>
  );
};
