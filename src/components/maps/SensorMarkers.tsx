// Migrated to deck.gl layers - see useSensorLayer hook
// This component is kept for backward compatibility but renders nothing
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';

import { Sensor, SensorType } from '../../model/sensor';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';

export type SensorMarker = {
  location: google.maps.LatLngLiteral;
  key: string;
  type: SensorType;
};

export const SensorMarkers = () => {
  // Legacy component kept for compatibility during migration. Rendering is now done via deck.gl layers.
  return null;
};
SensorMarkers.displayName = 'SensorMarkers';

const sensorTypeToEmoji = (sensorType: SensorType) => {
  switch (sensorType) {
    case 'TEMPERATURE_AND_AIR_HUMIDITY':
      return '🌡️';
    case 'WIND_SPEED':
      return '🌪';
    case 'WIND_DIRECTION':
      return '🧭';
    case 'LITTER_MOISTURE':
      return '🌿';
    case 'PM2_5':
      return '🫁';
    case 'CO2':
      return '💨';
    default:
      return '❌';
  }
};
