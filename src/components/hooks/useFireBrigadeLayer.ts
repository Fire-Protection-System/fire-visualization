import { useMemo } from 'react';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';
import { FireBrigade } from '../../model/FireBrigade';
import { eventEmitter } from '@shared/utils/eventEmitter';

export const useFireBrigadeLayer = () => {
  const fireBrigades = useSelector((state: RootState) => state.mapConfiguration.configuration.fireBrigades);
  // Get sector count to scale label visibility
  const sectorCount = useSelector((state: RootState) => state.mapConfiguration.configuration.sectors?.length || 0);

  const layers = useMemo(() => {
    if (!fireBrigades || fireBrigades.length === 0) {
      return [new ScatterplotLayer({ id: 'fire-brigade-layer', data: [] })];
    }

    // Color mapping based on fire brigade state
    const getStateColor = (state: string): [number, number, number] => {
      switch (state) {
        case 'TRAVELLING':
          return [0, 100, 255]; // Blue
        case 'EXTINGUISHING':
          return [255, 0, 0]; // Red
        case 'AVAILABLE':
          return [0, 200, 0]; // Green
        default:
          return [128, 128, 128]; // Gray
      }
    };

    // Scatterplot layer for the circles
    const scatterplotLayer = new ScatterplotLayer({
      id: 'fire-brigade-layer',
      data: fireBrigades.map((fb) => ({
        ...FireBrigade.toMarkerProps(fb),
        state: fb.state,
        fireBrigadeId: fb.fireBrigadeId,
        longitude: fb.currentLocation.longitude,
        latitude: fb.currentLocation.latitude
      })),
      getPosition: (d: any) => [d.longitude, d.latitude],
      getFillColor: (d: any) => getStateColor(d.state || 'AVAILABLE'),
      getRadius: 8,
      radiusUnits: 'pixels',
      radiusMinPixels: 6,
      radiusMaxPixels: 14,
      pickable: true,
      onClick: (info: any) => {
        if (info && info.object) {
          try {
            eventEmitter.emit('onFireBrigadeClick', info.object);
          } catch (e) {
          }
        }
      },
    });

    const textLayer = new TextLayer({
      id: 'fire-brigade-text-layer',
      data: fireBrigades.map((fb) => ({
        position: [fb.currentLocation.longitude, fb.currentLocation.latitude] as [number, number],
        text: `FireBrigade_${fb.fireBrigadeId.toString().padStart(2, '0')}`,
      })),
      getPosition: (d: any) => d.position,
      getText: (d: any) => d.text,
      getSize: sectorCount > 100 ? 7 : sectorCount > 50 ? 8 : sectorCount > 25 ? 9 : 10,
      getColor: [255, 255, 255, 255],
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getPixelOffset: [0, -15],
      background: true,
      // Strong, opaque black background for better contrast
      getBackgroundColor: [0, 0, 0, 240],
      fontFamily: 'Monaco, monospace',
      fontWeight: 'bold',
      billboard: true,
    });

    return [scatterplotLayer, textLayer];
  }, [fireBrigades, sectorCount]);

  return layers;
};
