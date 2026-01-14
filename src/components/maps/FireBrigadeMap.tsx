// maps
import { Map, useMap } from './MapLibre';
import { DeckGlOverlay } from './DeckGlOverlay';

// maps styles overrides
/**
 * This is a workaround to disable blue border around map component
 * when it is clicked
 */
import './maps-styles-overrides.css';

// material-ui
import { Grid, Box, Typography } from '@mui/material';
import { MainCard } from '../MainCard';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Configuration } from '../../model/configuration';
import { useForestBorderLayer } from '../hooks/useForestBorderLayer';
import { useSectorsLayer } from '../hooks/useSectorsLayer';
import { useSelectedSectorLayer, useTargetSectorLayer } from '../hooks/useSelectedSectorLayer';
import { useOnSectorChange } from '../hooks/useOnSectorChange';
import { useOnTooltipChange } from '../hooks/useOnTooltipChange';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';
import { setCurrentSectorId } from '../../store/mapConfigurationSlice';
import { FireBrigadeMarkers } from './FireBrigadeMarkers';
import { FireBrigadeBaseMarkers } from './FireBrigadeBaseMarkers';
import { useFireBrigadeLayer } from '../hooks/useFireBrigadeLayer';

type Props = {
   //   disableTooltip?: boolean;
   targetSectorId: number|null;
   onClickHandler: (sectorId: number) => void;
}
export const FireBrigadeMap = (props: Props) => {
   const map = useMap('main-map');
   const { configuration: mapConfiguration, currentSectorId } = useSelector(
      (state: RootState) => state.mapConfiguration,
   );
   const dispatch = useDispatch();

   const [tooltip, setTooltip] = useState<ReactNode>(null);

   // Disable panning in FireBrigadeMap - only NewConfigurationMap should allow panning
   // But allow clicks and hovers for sector selection
   useEffect(() => {
      if (!map) return;
      
      // Disable panning but keep other interactions enabled
      map.dragPan?.disable();
      
      // Ensure zoom and other interactions still work
      map.scrollZoom?.enable();
      map.boxZoom?.enable();
      map.doubleClickZoom?.enable();
      map.touchZoomRotate?.enable();
      
      return () => {
         map.dragPan?.enable();
      };
   }, [map]);

   const [bounds, setBounds] = useState(Configuration.getBounds(mapConfiguration));
   useEffect(() => {
      const newBounds = Configuration.getBounds(mapConfiguration);
      if (JSON.stringify(newBounds) !== JSON.stringify(bounds)) {
         setBounds(newBounds);
      }
   }, [mapConfiguration, bounds]); // keep same logic as MainMap to avoid unnecessary re-fit

   // If a specific target sector is selected, zoom to that sector bounds briefly
   useEffect(() => {
      if (!map) return;
      if (props.targetSectorId == null) return;
      const sector = mapConfiguration.sectors.find(s => s.sectorId === props.targetSectorId);
      if (!sector || !sector.contours || sector.contours.length === 0) return;

      const sw = [Math.min(...sector.contours.map(c => c[0])), Math.min(...sector.contours.map(c => c[1]))] as [number, number];
      const ne = [Math.max(...sector.contours.map(c => c[0])), Math.max(...sector.contours.map(c => c[1]))] as [number, number];
      try {
         map.fitBounds([sw, ne], { padding: 80 });
      } catch (e) {
      }
   }, [map, props.targetSectorId, mapConfiguration.sectors]);

   const forestBorderLayer = useForestBorderLayer(mapConfiguration);
   const sectorsLayer = useSectorsLayer(mapConfiguration, true, props.onClickHandler);
   const selectedSectorLayer = useSelectedSectorLayer(
      mapConfiguration.sectors.find(({ sectorId }) => sectorId === currentSectorId),
   );
 
   const targetSectorLayer = useTargetSectorLayer(
      mapConfiguration.sectors.find(({ sectorId }) => sectorId === props.targetSectorId && sectorId != currentSectorId) ,
   );
   const fireBrigadeLayer = useFireBrigadeLayer();

   const onSectorChange = useCallback(
      (sectorId: number | null) => {
         dispatch(setCurrentSectorId({ currentSectorId: sectorId }));
      },
      [dispatch],
   );
   useOnSectorChange(onSectorChange);

   if (Object.values(bounds).every((bound) => bound === 0))
      return (
         <Grid
            item
            xs={12}
            sx={{ mb: -2.25 }}
         >
            <MainCard
               hasContent={false}
               sx={{ mt: 1.5 }}
            >
               <Box
                  sx={{
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'center',
                     alignItems: 'center',
                     backgroundColor: 'secondary.light',
                     height: '800px' /* TODO fix fixed height */,
                  }}
               >
                  <Typography variant="h2">No configuration selected!</Typography>
                  <Typography variant="h4">Please select a configuration to see the map</Typography>
               </Box>
            </MainCard>
         </Grid>
      );

   return (
      <Grid
         item
         xs={12}
         sx={{ mb: -2.25 }}
      >
         <MainCard
            hasContent={false}
            sx={{ mt: 1.5 }}
         >
            <Box sx={{ height: '800px' /* TODO fix fixed height */ }}>
               <Map
                  id="main-map"
                  mapId={process.env.GOOGLE_MAP_ID_MAIN_MAP}
                  defaultBounds={bounds}
                  onDragstart={() => {
                     // hide tooltip when dragging the map
                     if (tooltip !== null) setTooltip(null);
                  }}
               >
                  {tooltip}
                  <DeckGlOverlay 
                    overlayId="fire-brigade-map"
                    capturePointerEvents={true} // Enable pointer events for sector hover/click
                    layers={[
                      forestBorderLayer, 
                      // Sector layers (shapes + labels) - spread array
                      ...(Array.isArray(sectorsLayer) ? sectorsLayer : [sectorsLayer]),
                      selectedSectorLayer, 
                      targetSectorLayer,
                      // Fire brigade layers (circle + label) - spread array
                      ...(Array.isArray(fireBrigadeLayer) ? fireBrigadeLayer : [fireBrigadeLayer]),
                    ].filter(Boolean)} />
                  <FireBrigadeMarkers />
                  <FireBrigadeBaseMarkers />
               </Map>
            </Box>
         </MainCard>
      </Grid>
   );
};
