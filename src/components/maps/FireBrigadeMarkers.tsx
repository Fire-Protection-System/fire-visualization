import { useRef, useEffect } from 'react';

// maps - no-op legacy component removed (migrated to deck.gl layer)
// kept file for compatibility; it won't render anything in PoC


import { useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';
import { FireBrigade, FireBrigadeState } from '../../model/FireBrigade';

export type FireBrigadeMarker = {
  location: google.maps.LatLngLiteral;
  key: string;
  state: FireBrigadeState;
};

export const FireBrigadeMarkers = () => {
  // Legacy component kept for compatibility during migration. Marker rendering moved to deck.gl layers.
  return null;
};

const fireBrigadeStateToEmoji = (fireBrigadeState: FireBrigadeState) => {
  switch (fireBrigadeState) {
    case 'AVAILABLE':
      return '🚒';
    case 'TRAVELLING':
      return '🚒';
    case 'EXTINGUISHING':
      return '🚒';
    default:
      return '🚒';
  }
};
