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
import { Grid, Box, Typography, IconButton } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import { MainCard } from '../MainCard';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Configuration } from '../../model/configuration';
import { useFireBrigadeLayer } from '../hooks/useFireBrigadeLayer';
import { eventEmitter } from '@shared/utils/eventEmitter';
import { useForesterPatrolLayer } from '../hooks/useForesterPatrolLayer';
import { useSensorLayer } from '../hooks/useSensorLayer';
import { useCameraLayer } from '../hooks/useCameraLayer';
import { useForestBorderLayer } from '../hooks/useForestBorderLayer';
import { useSectorsLayer } from '../hooks/useSectorsLayer';
import { useSelectedSectorLayer } from '../hooks/useSelectedSectorLayer';
import { useOnSectorChange } from '../hooks/useOnSectorChange';
import { useOnTooltipChange } from '../hooks/useOnTooltipChange';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';
import { setCurrentSectorId } from '../../store/mapConfigurationSlice';
import { SensorMarkers } from './SensorMarkers';
import { CameraMarkers } from './CameraMarkers';
import { ForesterPatrolMarkers } from './ForesterPatrolMarkers';
import { FireBrigadeMarkers } from './FireBrigadeMarkers';
import { FireBrigadeBaseMarkers } from './FireBrigadeBaseMarkers';
import { ForesterPatrolBaseMarkers } from './ForesterPatrolBaseMarkers';
import FireBrigadeDialog from '../simulation/FireBrigadeDialog';

export const MainMap = () => {
  const { configuration: mapConfiguration, currentSectorId } = useSelector(
    (state: RootState) => state.mapConfiguration,
  );
  const dispatch = useDispatch();

  const [tooltip, setTooltip] = useState<ReactNode>(null);

  const [bounds, setBounds] = useState(() => Configuration.getBounds(mapConfiguration));
  
  useEffect(() => {
    const newBounds = Configuration.getBounds(mapConfiguration);
    // Only update bounds if they actually changed (shallow comparison is sufficient for bounds)
    if (
      newBounds.north !== bounds.north ||
      newBounds.south !== bounds.south ||
      newBounds.east !== bounds.east ||
      newBounds.west !== bounds.west
    ) {
      setBounds(newBounds);
    }
  }, [mapConfiguration]); // Removed bounds from dependencies to avoid unnecessary re-renders
  // Bounds are passed to MapLibre via props; MapLibre will call fitBounds when they change.

  const forestBorderLayer = useForestBorderLayer(mapConfiguration);
  const sectorsLayer = useSectorsLayer(mapConfiguration);
  const selectedSectorLayer = useSelectedSectorLayer(
    mapConfiguration.sectors.find(({ sectorId }) => sectorId === currentSectorId),
  );

  // marker layers (deck.gl PoC)
  const fireBrigadeLayer = useFireBrigadeLayer();
  const foresterPatrolLayer = useForesterPatrolLayer();
  const sensorLayer = useSensorLayer();
  const cameraLayer = useCameraLayer();

  useOnTooltipChange(setTooltip);

  // handle clicks on fire brigades (from deck.gl layer)
  useEffect(() => {
    const onClick = (brigade: any) => {
      // show a small tooltip as confirmation; other components can subscribe to 'onFireBrigadeClick'
      const tooltip = (
        <div style={{ padding: '6px', background: 'rgba(0,0,0,0.75)', color: 'white', borderRadius: 4 }}>
          Send brigade: {brigade.fireBrigadeId}
        </div>
      );
      // emit tooltip via existing mechanism
      try {
        eventEmitter.emit('onTooltipChange', tooltip);
      } catch (e) {
      }
    };

    eventEmitter.addListener('onFireBrigadeClick', onClick);
    return () => eventEmitter.removeListener('onFireBrigadeClick', onClick);
  }, []);

  const onSectorChange = useCallback(
    (sectorId: number | null) => {
      try {
        dispatch(setCurrentSectorId({ currentSectorId: sectorId }));
      } catch (error) {
        throw error;
      }
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
            defaultBounds={bounds}
            onDragstart={() => {
              // hide tooltip when dragging the map
              if (tooltip !== null) setTooltip(null);
            }}
          >
            <MainMapInner
              tooltip={tooltip}
              bounds={bounds}
              forestBorderLayer={forestBorderLayer}
              sectorsLayer={sectorsLayer}
              selectedSectorLayer={selectedSectorLayer}
              fireBrigadeLayer={fireBrigadeLayer}
              foresterPatrolLayer={foresterPatrolLayer}
              sensorLayer={sensorLayer}
              cameraLayer={cameraLayer}
            />
          </Map>
        </Box>
      </MainCard>
    </Grid>
  );
};

type MainMapInnerProps = {
  tooltip: ReactNode;
  bounds: ReturnType<typeof Configuration.getBounds>;
  forestBorderLayer: any;
  sectorsLayer: any;
  selectedSectorLayer: any;
  fireBrigadeLayer: any;
  foresterPatrolLayer: any;
  sensorLayer: any;
  cameraLayer: any;
};

const MainMapInner = ({
  tooltip,
  bounds,
  forestBorderLayer,
  sectorsLayer,
  selectedSectorLayer,
  fireBrigadeLayer,
  foresterPatrolLayer,
  sensorLayer,
  cameraLayer,
}: MainMapInnerProps) => {
  const map = useMap();

  // Disable panning in MainMap - only NewConfigurationMap should allow panning
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

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1000,
          width: '100%',
          height: '100%',
        }}
      >
        {tooltip}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <IconButton
          size="small"
          onClick={() => {
            if (!map) return;
            const current = map.getZoom();
            map.easeTo({ zoom: current + 1 });
          }}
          color="primary"
          aria-label="Zoom in"
        >
          <ZoomInIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            if (!map) return;
            const current = map.getZoom();
            map.easeTo({ zoom: current - 1 });
          }}
          color="primary"
          aria-label="Zoom out"
        >
          <ZoomOutIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            if (map) {
              const sw = [bounds.west, bounds.south] as [number, number];
              const ne = [bounds.east, bounds.north] as [number, number];
              map.fitBounds([sw, ne], { padding: 50 });
            }
          }}
          color="primary"
          aria-label="Fit bounds"
        >
          <FitScreenIcon />
        </IconButton>
      </div>
      <DeckGlOverlay
        overlayId="main-map"
        capturePointerEvents={true} // Enable pointer events for sector hover/click
        layers={[
          forestBorderLayer,
          sectorsLayer,
          selectedSectorLayer,
          ...(Array.isArray(fireBrigadeLayer) ? fireBrigadeLayer : [fireBrigadeLayer]),
          ...(Array.isArray(foresterPatrolLayer) ? foresterPatrolLayer : [foresterPatrolLayer]),
          ...(Array.isArray(sensorLayer) ? sensorLayer : [sensorLayer]),
          ...(Array.isArray(cameraLayer) ? cameraLayer : [cameraLayer]),
        ].filter(Boolean)}
      />
    </>
  );
};

