import { useMemo } from 'react';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reduxStore';
import { ForesterPatrol } from '../../model/ForesterPatrol';

export const useForesterPatrolLayer = () => {
  const patrols = useSelector((state: RootState) => state.mapConfiguration.configuration.foresterPatrols);
  // Get sector count to scale label visibility
  const sectorCount = useSelector((state: RootState) => state.mapConfiguration.configuration.sectors?.length || 0);

  const layers = useMemo(() => {
    if (!patrols || patrols.length === 0) {
      return [new ScatterplotLayer({ id: 'forester-patrol-layer', data: [] })];
    }

    // Color mapping based on forester patrol state
    const getStateColor = (state: string): [number, number, number] => {
      switch (state) {
        case 'TRAVELLING':
          return [100, 150, 255]; // Light blue
        case 'PATROLLING':
          return [255, 165, 0]; // Orange - more distinct from AVAILABLE
        case 'AVAILABLE':
          return [128, 128, 128]; // Gray
        default:
          return [128, 128, 128]; // Gray
      }
    };

    const scatterplotLayer = new ScatterplotLayer({
      id: 'forester-patrol-layer',
      data: patrols.map((p) => ({
        ...ForesterPatrol.toMarkerProps(p),
        foresterPatrolId: p.foresterPatrolId,
        state: p.state,
        longitude: p.currentLocation.longitude,
        latitude: p.currentLocation.latitude
      })),
      getPosition: (d: any) => [d.longitude, d.latitude],
      getFillColor: (d: any) => getStateColor(d.state || 'AVAILABLE'),
      getRadius: 5,
      radiusUnits: 'pixels',
      radiusMinPixels: 4,
      radiusMaxPixels: 8,
      pickable: true,
    });

    const textLayer = new TextLayer({
      id: 'forester-patrol-text-layer',
      data: patrols.map((p) => ({
        position: [p.currentLocation.longitude, p.currentLocation.latitude] as [number, number],
        text: `ForesterPatrol_${p.foresterPatrolId.toString().padStart(2, '0')}`,
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
      getBackgroundColor: [0, 0, 0, 240],
      fontFamily: 'Monaco, monospace',
      fontWeight: 'bold',
      billboard: true,
    });

    return [scatterplotLayer, textLayer];
  }, [patrols, sectorCount]);

  return layers;
};