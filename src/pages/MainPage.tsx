// material-ui
import { Grid } from '@mui/material';

// maps
import { MapWrapper } from '@features/maps';
import { MainMap } from '../components/maps/maps/MainMap';

// configuration
import { ConfigurationForm } from '@features/configuration/ConfigurationForm';

export const MainPage = () => {
  return (
    <Grid
      container
      rowSpacing={4.5}
      columnSpacing={2.75}
    >
      <MapWrapper>
        <MainMap />
      </MapWrapper>
      <Grid
        item
        xs={12}
      >
        <ConfigurationForm />
      </Grid>
    </Grid>
  );
};
