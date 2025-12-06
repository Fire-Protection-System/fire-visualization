import { Outlet } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Toolbar } from '@mui/material';

// project import
import { Header } from './SimulationLayout/Header';

export const SimulationLayout = () => {
  useTheme();

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Header/>      
      <Box
        component="main"
        sx={{ width: '100%', flexGrow: 1, p: { xs: 2, sm: 3 } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
