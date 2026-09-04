import { useEffect } from 'react';

import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setPageSize } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';

import { GRID_GAP, MIN_TILE_WIDTH } from '../utils/calculateBestGridLayout';
import { calculateFittingTileCount } from '../utils/calculateFittingTileCount';

/** Sets the grid page size to how many tiles fit the container, clamped to [SMALL_SCREEN_PAGE_SIZE, PAGE_SIZE]. */
export const useFittingPageSize = (
    size: { width: number; height: number },
    tileAspectRatio: number,
    getLayout: (count: number) => { cols: number; rows: number },
    reservedTiles = 0
) => {
    const dispatch = useMeetDispatch();

    useEffect(() => {
        // Wait for a real measurement so we don't briefly collapse to the minimum on mount.
        if (size.width === 0 || size.height === 0) {
            return;
        }

        const fittingTileCount = calculateFittingTileCount({
            containerWidth: size.width,
            containerHeight: size.height,
            gap: GRID_GAP,
            minTileWidth: MIN_TILE_WIDTH,
            tileAspectRatio,
            maxTiles: PAGE_SIZE,
            minTiles: SMALL_SCREEN_PAGE_SIZE,
            getLayout,
        });

        dispatch(setPageSize(Math.max(1, fittingTileCount - reservedTiles)));
    }, [dispatch, size.width, size.height, tileAspectRatio, getLayout, reservedTiles]);
};
