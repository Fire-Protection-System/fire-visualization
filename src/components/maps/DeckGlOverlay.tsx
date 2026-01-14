import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from './MapLibre';
import DeckGL from '@deck.gl/react';
import type { LayersList } from '@deck.gl/core';

export type DeckglOverlayProps = { 
  layers?: LayersList;
  overlayId?: string; // Optional ID for multiple overlays
  capturePointerEvents?: boolean; // Whether this overlay should capture pointer events
};

/**
 * DeckGL overlay for MapLibre - renders deck.gl layers on top of the map
 */
export const DeckGlOverlay = ({ layers, overlayId = 'default', capturePointerEvents = false }: DeckglOverlayProps) => {
  const map: any = useMap();
  const [overlayContainer, setOverlayContainer] = useState<HTMLDivElement | null>(null);
  const [viewState, setViewState] = useState<any>(null);

  useEffect(() => {
    if (!map) return;

    const mapContainer = map.getContainer?.() || map.getDiv?.();
    if (!mapContainer) {
      return;
    }

    // Create or reuse overlay div with unique ID
    const overlayClassName = `deck-overlay-${overlayId}`;
    let overlayDiv = mapContainer.querySelector(`.${overlayClassName}`) as HTMLDivElement;
    if (!overlayDiv) {
      overlayDiv = document.createElement('div');
      overlayDiv.className = overlayClassName;
      overlayDiv.style.position = 'absolute';
      overlayDiv.style.top = '0';
      overlayDiv.style.left = '0';
      overlayDiv.style.width = '100%';
      overlayDiv.style.height = '100%';
      // Use different z-index for drawing overlay
      overlayDiv.style.zIndex = overlayId === 'drawing' ? '2' : '1';
      mapContainer.appendChild(overlayDiv);
    } else {
    }

    setOverlayContainer(overlayDiv);

    const updateViewState = () => {
      if (!map) return;
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bearing = map.getBearing?.() ?? 0;
        
        setViewState({
          longitude: center.lng,
          latitude: center.lat,
          zoom: zoom,
          bearing: bearing,
          pitch: 0
        });
      } catch (err) {
      }
    };

    updateViewState();
    map.on('move', updateViewState);
    map.on('moveend', updateViewState);

    return () => {
      map.off('move', updateViewState);
      map.off('moveend', updateViewState);
    };
  }, [map, overlayId]);

  // Update pointer events when capturePointerEvents changes
  useEffect(() => {
    if (!overlayContainer) {
      return;
    }

    const pointerEventsValue = capturePointerEvents ? 'auto' : 'none';
    overlayContainer.style.pointerEvents = pointerEventsValue;
    
    // Function to update canvas pointer events (canvas might be created later)
    const updateCanvasPointerEvents = () => {
      const canvas = overlayContainer.querySelector('canvas');
      if (canvas) {
        canvas.style.pointerEvents = pointerEventsValue;
      }
    };
    
    // Update immediately if canvas exists
    updateCanvasPointerEvents();
    
    // Also watch for canvas creation (DeckGL creates canvas asynchronously)
    const observer = new MutationObserver(() => {
      updateCanvasPointerEvents();
    });
    
    observer.observe(overlayContainer, {
      childList: true,
      subtree: true,
    });
    
    
    // Add mousedown listener for debugging (only for drawing overlay)
    let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
    if (overlayId === 'drawing') {
      mouseDownHandler = (e: MouseEvent) => {
        const canvas = overlayContainer.querySelector('canvas');
        if (canvas) {
        }
      };
      overlayContainer.addEventListener('mousedown', mouseDownHandler, true);
    }
    
    return () => {
      observer.disconnect();
      if (mouseDownHandler) {
        overlayContainer.removeEventListener('mousedown', mouseDownHandler, true);
      }
    };
  }, [overlayContainer, capturePointerEvents, overlayId]);

  if (!overlayContainer || !viewState) {
    return null;
  }

  return createPortal(
    <DeckGL
      viewState={viewState}
      controller={false}
      layers={layers || []}
      style={{ pointerEvents: capturePointerEvents ? 'auto' : 'none' }}
      getCursor={() => 'inherit'}
    />,
    overlayContainer
  );
};