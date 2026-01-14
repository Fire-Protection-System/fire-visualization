import React, { PropsWithChildren, useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';
import maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export type MapProps = {
  id?: string;
  defaultBounds?: { north: number; east: number; south: number; west: number };
  initialCenter?: [number, number];
  initialZoom?: number;
  onDragstart?: () => void;
  style?: React.CSSProperties;
};

type MapContextValue = {
  map: maplibre.Map | null;
};

const MapContext = createContext<MapContextValue | null>(null);

export const Map = (props: PropsWithChildren<MapProps>) => {
  const { children, id, defaultBounds, initialCenter, initialZoom, onDragstart, style } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<maplibre.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mapInstance = new maplibre.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }
        },
        layers: [
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: initialCenter ?? [0, 0],
      zoom: initialZoom ?? 1,
      maxZoom: 22,
      preserveDrawingBuffer: true, // Prevent WebGL context loss
      failIfMajorPerformanceCaveat: false
    });

    // Add administrative boundaries layer after map loads
    mapInstance.on('load', () => {
      try {
        // Add administrative boundaries using a vector tile service
        // Using OpenMapTiles free tier (you may want to get your own key for production)
        const boundariesSource = {
          type: 'vector' as const,
          tiles: [
            'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
          ],
          minzoom: 0,
          maxzoom: 14
        };

        mapInstance.addSource('boundaries', boundariesSource);

        // Add country boundaries (admin_level 2)
        mapInstance.addLayer({
          id: 'admin-boundary-country',
          type: 'line',
          source: 'boundaries',
          'source-layer': 'boundary',
          filter: ['==', 'admin_level', 2],
          paint: {
            'line-color': '#ffffff',
            'line-width': 2.5,
            'line-opacity': 0.9
          },
          minzoom: 2
        });

        // Add state/province boundaries (admin_level 4)
        mapInstance.addLayer({
          id: 'admin-boundary-state',
          type: 'line',
          source: 'boundaries',
          'source-layer': 'boundary',
          filter: ['==', 'admin_level', 4],
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.5,
            'line-opacity': 0.8,
            'line-dasharray': [3, 2]
          },
          minzoom: 4
        });

        // Add county boundaries (admin_level 6)
        mapInstance.addLayer({
          id: 'admin-boundary-county',
          type: 'line',
          source: 'boundaries',
          'source-layer': 'boundary',
          filter: ['==', 'admin_level', 6],
          paint: {
            'line-color': '#cccccc',
            'line-width': 1,
            'line-opacity': 0.6,
            'line-dasharray': [2, 2]
          },
          minzoom: 8
        });
      } catch (error) {
      }
    });

    mapInstance.on('movestart', () => {
      if (onDragstart) onDragstart();
    });

    // Add error handling for WebGL context loss
    mapInstance.on('webglcontextlost', (e) => {
      e.preventDefault();
    });

    mapInstance.on('webglcontextrestored', () => {
    });

    setMap(mapInstance);

    // Ensure the map is resized when the container changes size (prevents trimmed/zoomed view)
    // Use ResizeObserver for reliable detection and also handle window resize as a fallback
    const ro = new ResizeObserver(() => {
      try {
        mapInstance.resize();
        // trigger a repaint for safety
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (mapInstance.triggerRepaint) mapInstance.triggerRepaint();
      } catch (err) {
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    // Some browsers may layout late, ensure initial correct sizing
    setTimeout(() => mapInstance.resize(), 0);

    const onWindowResize = () => mapInstance.resize();
    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      ro.disconnect();
      mapInstance.remove();
      setMap(null);
    };
  }, []); // Empty deps - map should only be created once!

  useEffect(() => {
    if (!map || !defaultBounds) return;
    // fitBounds expects [sw, ne] - use jumpTo for instant positioning without animation
    const sw = [defaultBounds.west, defaultBounds.south] as [number, number];
    const ne = [defaultBounds.east, defaultBounds.north] as [number, number];
    map.fitBounds([sw, ne], { duration: 0, padding: 50 });
  }, [map, defaultBounds]);

  const value = useMemo(() => ({ map }), [map]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <div 
        ref={containerRef} 
        data-testid={id ?? 'map'} 
        style={{ 
          width: '100%', 
          height: '100%',
          border: '2px solid #333',
          borderRadius: '4px',
          boxSizing: 'border-box'
        }} 
      />
      <MapContext.Provider value={value}>{map ? children : null}</MapContext.Provider>
    </div>
  );
};

export const useMap = (id: string | null = null): maplibre.Map | null => {
  const ctx = useContext(MapContext);
  return ctx?.map ?? null;
};
