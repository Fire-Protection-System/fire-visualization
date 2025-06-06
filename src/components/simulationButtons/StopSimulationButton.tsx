import { Button } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/reduxStore';
import { ConfigurationUpdate, isDefaultConfiguration } from '../../model/configuration/configuration';
import { updateConfiguration } from '../../store/reducers/mapConfigurationSlice';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useNavigate } from 'react-router-dom';
import { abortConnection } from '../../store/reducers/serverCommunicationReducers';

export const StopSimulationButton = () => {
  const { configuration: mapConfiguration } = useSelector((state: RootState) => state.mapConfiguration);
  const dispatch: AppDispatch = useDispatch();
  
  const navigate = useNavigate();  

  const stopSimulation = useCallback(() => {       
    // console.log("Simulation stopped");
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
