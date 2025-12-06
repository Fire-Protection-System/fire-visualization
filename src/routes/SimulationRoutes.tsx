import { SimulationLayout } from '../layout/SimulationLayout';
import { SimulationPage } from '../pages/SimulationPage';

// ==============================|| MAIN ROUTING ||============================== //

export const SimulationRoutes = {
   path: '/',
   element: <SimulationLayout />,
   children: [
      {
         path: 'simulation',
         element: <SimulationPage />,
      }
   ],
};
