// Migrated to deck.gl layers - see useCameraLayer hook
// This component is kept for backward compatibility but renders nothing
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';

import { useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';
import { Camera } from '../../model/camera';

export type CameraMarker = {
  location: google.maps.LatLngLiteral;
  key: string;
};

export const CameraMarkers = () => {
  // Legacy component kept for compatibility during migration. Rendering is now done via deck.gl layer.
  return null;
};
