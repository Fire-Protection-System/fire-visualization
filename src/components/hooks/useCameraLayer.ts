import { useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';
import { eventEmitter } from '@shared/utils/eventEmitter';

export const useCameraLayer = () => {
  const cameras = useSelector((state: RootState) => state.mapConfiguration.configuration.cameras);

  return useMemo(() => {
    return new ScatterplotLayer({
      id: 'camera-layer',
      data: cameras,
      getPosition: (d: any) => [d.location.lng, d.location.lat],
      // Purple color for cameras to distinguish from sensors and brigades
      getFillColor: [186, 85, 211],
      getRadius: 150,
      radiusMinPixels: 6,
      radiusMaxPixels: 16,
      pickable: true,
      onClick: (info: any) => {
        if (info?.object) {
          try {
            eventEmitter.emit('onCameraClick', info.object);
          } catch (e) {
          }
        }
      },
    });
  }, [cameras]);
};