import { useEffect } from 'react';
import { eventEmitter } from '@shared/utils/eventEmitter';

export const useOnSectorChange = (onSectorChangeCallback: (sectorId: number | null) => void) => {
  useEffect(
    () => {
      // Wrap callback with error handling to prevent webpack dev server errors
      const safeCallback = (sectorId: number | null) => {
        try {
          onSectorChangeCallback(sectorId);
        } catch (error) {
          window.__LAST_SECTOR_ERROR__ = error;
        }
      };

      eventEmitter.addListener('onSectorChange', safeCallback);

      return () => {
        eventEmitter.removeListener('onSectorChange', safeCallback);
      };
    },
    // ON PURPOSE:
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
};
