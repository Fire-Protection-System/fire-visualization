import { PolygonLayer } from '@deck.gl/layers';
import { Sector } from '../../../model/sector';

export const useSelectedSectorLayer = (sector?: Sector) => {
  return new PolygonLayer<Sector>({
    id: 'SelectedSector',
    data: sector ? [sector] : [],
    extruded: false,
    filled: false,
    stroked: true,
    getPolygon: (s) => s.contours,
    getLineColor: [255, 255, 0],
    getLineWidth: 20,
    pickable: false,
  });
};
