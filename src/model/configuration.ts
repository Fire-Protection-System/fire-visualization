import { getDefaultSector, Sector, SectorUpdate } from './sector';
import { Sensor } from './sensor';
import { Camera } from './camera';
import { FireBrigade, FireBrigadeUpdate } from './FireBrigade';
import { ForesterPatrol, ForesterPatrolUpdate } from './ForesterPatrol';
import { Region } from './geography';
import { linspace } from '@shared/utils/linspace';
import { ProcessedSector } from './processedSector';
import { isPointInBounds } from '@shared/utils/isPointInBounds';
import { RecommendedAction } from './recommendation';

export interface Forest {
  forestId: number;
  forestName: string;
  rows: number;
  columns: number;
  location: Region;
}

export interface Configuration extends Forest {
  sectors: Sector[];
  sensors: Sensor[];
  cameras: Camera[];
  fireBrigades: FireBrigade[];
  foresterPatrols: ForesterPatrol[];
  recommendations: Record<number, RecommendedAction>; 
}

export type ConfigurationUpdate = {
  forestName: string;
  timestamp: string; // TODO change to number
  sectors: SectorUpdate[];
  fireBrigades: FireBrigadeUpdate[];
  foresterPatrols: ForesterPatrolUpdate[];
};

export const Configuration = {
  getBounds: ({ location }: Configuration): google.maps.LatLngBoundsLiteral => {
    return {
      east: location.reduce((maxLng: number, { longitude }) => {
        if (longitude > maxLng) maxLng = longitude;
        return maxLng;
      }, -Infinity), // lng
      north: location.reduce((maxLat: number, { latitude }) => {
        if (latitude > maxLat) maxLat = latitude;
        return maxLat;
      }, -Infinity), // lat
      south: location.reduce((minLat: number, { latitude }) => {
        if (latitude < minLat) minLat = latitude;
        return minLat;
      }, Infinity), // lat
      west: location.reduce((minLng: number, { longitude }) => {
        if (longitude < minLng) minLng = longitude;
        return minLng;
      }, Infinity), // lng
    };
  },
  createSectors: (configuration: Configuration): Sector[] => {
    const { rows, columns } = configuration;

    const sectors: Sector[] = [];

    let sectorId = 1;
    // for (let row = 0; row < rows; row++) {
    //   for (let column = 0; column < columns; column++) {
    for (let row = 1; row <= rows; row++) {
      for (let column = 1; column <= columns; column++) {
        const defaultSector = getDefaultSector();
        sectors.push({
          ...defaultSector,
          sectorId,
          row,
          column,
        });
        sectorId++;
      }
    }

    return sectors;
  },
  preprocessSectors: (configuration: Configuration): Sector[] => {
    const { sectors: rawSectors, rows, columns } = configuration;

    const { east, north, south, west } = Configuration.getBounds(configuration);
    const linspaceLat = linspace(south, north, rows + 1);
    const linspaceLng = linspace(west, east, columns + 1);

    // Determine if the input configuration is 1-indexed or 0-indexed
    // Most configs should be 1-indexed for the frontend, but we handle both for robustness
    const isOneIndexed = rawSectors.some(s => s.row === rows || s.column === columns);

    return rawSectors.map((rawSector) => {
      const rowIdx = isOneIndexed ? rawSector.row - 1 : rawSector.row;
      const colIdx = isOneIndexed ? rawSector.column - 1 : rawSector.column;
      
      // Ensure the row and column in the object are 1-indexed for labels and display
      const normalizedRow = isOneIndexed ? rawSector.row : rawSector.row + 1;
      const normalizedCol = isOneIndexed ? rawSector.column : rawSector.column + 1;

      if (rawSector.sectorId === 1 || rawSector.sectorId === rawSectors.length) {
      }

      return {
        ...rawSector,
        row: normalizedRow,
        column: normalizedCol,
        contours: [
          [linspaceLng[colIdx], linspaceLat[rowIdx]],
          [linspaceLng[colIdx], linspaceLat[rowIdx + 1]],
          [linspaceLng[colIdx + 1], linspaceLat[rowIdx + 1]],
          [linspaceLng[colIdx + 1], linspaceLat[rowIdx]],
        ],
      };
    });
  },
  getSensorsForSectorId: (configuration: Configuration, sectorId: number): Sensor[] => {
    const { sectors, sensors } = configuration;

    const sector = sectors.find((sec) => sec.sectorId === sectorId);
    if (!sector) {
      return [];
    }

    const sectorBounds = Sector.getBoundsFromContours(sector);

    return sensors.filter(({ location }) => isPointInBounds(location, sectorBounds));
  },
  getCamerasForSectorId: (configuration: Configuration, sectorId: number): Camera[] => {
    const { sectors, cameras } = configuration;

    const sector = sectors.find((sec) => sec.sectorId === sectorId);
    if (!sector) {
      return [];
    }

    const sectorBounds = Sector.getBoundsFromContours(sector);

    return cameras.filter(({ location }) => isPointInBounds(location, sectorBounds));
  },
  sectors: {
    toString: (sector: ProcessedSector) => {
      const fireStr = sector.fireLevel !== null && sector.fireLevel !== undefined ? `\n        🔥 Fire Level: ${sector.fireLevel.toFixed(2)}` : '';
      const burnStr = sector.burnLevel !== null && sector.burnLevel !== undefined ? `\n        💨 Burn Level: ${sector.burnLevel.toFixed(2)}` : '';
      const extStr = sector.extinguishLevel !== null && sector.extinguishLevel !== undefined ? `\n        🧯 Extinguish Level: ${sector.extinguishLevel.toFixed(2)}` : '';

      return `Sector ID: ${sector.sectorId} [R${sector.row}, C${sector.column}]
        Forest type: ${sector.sectorType}
        Temperature: ${sector.initialState.temperature.toFixed(1)}°C
        Wind: ${sector.initialState.windSpeed} km/h ${sector.initialState.windDirection}
        Humidity: ${sector.initialState.airHumidity}%${fireStr}${burnStr}${extStr}`;
    },
  },
  updateConfiguration: (configuration: Configuration, configurationUpdate: ConfigurationUpdate): Configuration => {
    // Guard against empty updates - keep existing data if update has none
    const updatedFireBrigades = configurationUpdate.fireBrigades && configurationUpdate.fireBrigades.length > 0
      ? configurationUpdate.fireBrigades.map(fb => ({
          fireBrigadeId: fb.fireBrigadeId,
          timestamp: Date.now(),
          state: fb.state,
          baseLocation: configuration.fireBrigades.find(b => b.fireBrigadeId === fb.fireBrigadeId)?.baseLocation || fb.location,
          currentLocation: fb.location,
          sectorId: fb.sectorId,
        }))
      : configuration.fireBrigades;
      
    const updatedForesterPatrols = configurationUpdate.foresterPatrols && configurationUpdate.foresterPatrols.length > 0
      ? configurationUpdate.foresterPatrols.map(fp => ({
          foresterPatrolId: fp.foresterPatrolId,
          timestamp: Date.now(),
          state: fp.state,
          baseLocation: configuration.foresterPatrols.find(p => p.foresterPatrolId === fp.foresterPatrolId)?.baseLocation || fp.location,
          currentLocation: fp.location,
          sectorId: fp.sectorId,
        }))
      : configuration.foresterPatrols;

    return {
      ...configuration,
      sectors: configuration.sectors.map((sector) => {
        const sectorUpdate = configurationUpdate.sectors.find(({ sectorId }) => sectorId === sector.sectorId);
        if (!sectorUpdate) {
          console.warn(
            `Configuration.updateConfiguration couldn't find updated sector with provided ID: ${sector.sectorId}`
          );
          return sector;
        }

        return Sector.updateSector(sector, sectorUpdate);
      }),
      fireBrigades: updatedFireBrigades,
      foresterPatrols: updatedForesterPatrols,
      // TODO update timestamp
      // TODO update rest of the fields?
    };
  },
};

export const getDefaultConfiguration = (): Configuration => {
  return {
    forestId: 0,
    forestName: 'Wolski',
    rows: 1,
    columns: 1,
    location: [
      {
        latitude: 0,
        longitude: 0,
      },
      {
        latitude: 0,
        longitude: 0,
      },
      {
        latitude: 0,
        longitude: 0,
      },
      {
        latitude: 0,
        longitude: 0,
      },
    ],
    sectors: [getDefaultSector()],
    sensors: [],
    cameras: [],
    fireBrigades: [],
    foresterPatrols: [],
    recommendations: {},
  };
};

export const isDefaultConfiguration = (configuration: Configuration): boolean => {
  return (
    configuration.forestId === 0 &&
    configuration.forestName === 'Wolski' &&
    configuration.rows === 1 &&
    configuration.columns === 1 &&
    configuration.location.every((loc) => loc.latitude === 0 && loc.longitude === 0)
  );
};
