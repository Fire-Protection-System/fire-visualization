// material-ui
import { Box, Grid } from '@mui/material';

// maps
import { MapWrapper } from '../components/maps/MapWrapper';
import { MainMap } from '../components/maps/maps/MainMap';
import DetailsContainer from '../components/simulationPanel/DetailsContainer';
import FireInformationContainer from '../components/simulationPanel/FireInformationContainer';
import RecommendedDecisions from '../components/simulationPanel/RecomendedDecisions';
import FireBrigadeManagement from '../components/simulationPanel/FireBrigade/FireBrigadeManagement';
import ForestPatrolManagement from '../components/simulationPanel/ForestPatrol/ForestPatrolManagement';

import SimulationDetailsTable from './SimulationDetailsTable';
import ActorsDetailsTable from './ActorsDetailsTable';


export const SimulationPage = () => {
  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
    <Grid item xs={12}>
      <Grid container spacing={2}>
        {/* Left: Map */}
        <Grid item xs={12} md={8}>
          <MapWrapper>
            <MainMap />
          </MapWrapper>
        </Grid>
  
        <Grid item xs={12} md={4}>
          <SimulationDetailsTable />
          <Box mt={2} />
          <ActorsDetailsTable />
        </Grid>
      </Grid>
    </Grid>
  
    {/* Other panels below the map+table row */}
    <Grid item xs={12}>
      <DetailsContainer />
      <FireInformationContainer />
      <RecommendedDecisions />
      <FireBrigadeManagement />
      <ForestPatrolManagement />
    </Grid>
  </Grid>
  
  );
};
