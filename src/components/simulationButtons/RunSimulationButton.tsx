import { Button } from '@mui/material';
import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/reduxStore';
import { isDefaultConfiguration } from '../../model/configuration/configuration';
import { useNavigate } from 'react-router-dom';
import { startFetchingConfigurationUpdate } from '../../store/reducers/serverCommunicationReducers';

//probably something here is used instead of stop simulation button
export const RunSimulationButton = () => {
  const { configuration: mapConfiguration } = useSelector((state: RootState) => state.mapConfiguration);
  const dispatch: AppDispatch = useDispatch();

  const navigate = useNavigate();  

  useRef<AbortController>(new AbortController());

  const fetchConfigurationUpdate = useCallback(() => {
    console.log("Fetch configuration update")

    dispatch(startFetchingConfigurationUpdate())
    
    
  }, [dispatch, mapConfiguration]);

  const startSimulation = useCallback(() => {       
    navigate('/simulation');
    fetchConfigurationUpdate();

   

  }, []);


  console.log("AbortController")
  console.log(new AbortController());

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
