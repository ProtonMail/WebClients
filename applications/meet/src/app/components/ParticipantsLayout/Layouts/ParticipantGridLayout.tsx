import { useCallback, useMemo, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components/index';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPagedIdentities } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';

import { useSortedPagedParticipants } from '../../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useElementSize } from '../../../hooks/useElementSize';
import { useFittingPageSize } from '../../../hooks/useFittingPageSize';
import { useIsLargerThanMd } from '../../../hooks/useIsLargerThanMd';
import {
    GRID_GAP,
    TILE_ASPECT_RATIO,
    balancedGridLayout,
    calculateBestGridLayout,
} from '../../../utils/calculateBestGridLayout';
import { ParticipantTile } from './shared/ParticipantTile/ParticipantTile';
import { ScreenShareTile } from './shared/ScreenShareTile';

export const ParticipantGridLayout = () => {
    const pagedParticipantIdentities = useMeetSelector(selectPagedIdentities);

    const pagedParticipants = useSortedPagedParticipants();

    const isScreenShare = useMeetSelector(selectIsScreenShare);

    const screenShareTileCount = isScreenShare ? 1 : 0;

    const containerRef = useRef<HTMLDivElement>(null);

    const size = useElementSize(containerRef);

    const isNarrow = !useIsLargerThanMd();

    // Narrow screens use a balanced grid of square tiles (e.g. 4 → 2×2); wider screens maximize
    // 16:9 tiles for the available shape. Capacity and render share this so the page size reflects
    // the tiles that are actually drawn.
    const tileAspectRatio = isNarrow ? 1 : TILE_ASPECT_RATIO;
    const getLayout = useCallback(
        (count: number) =>
            isNarrow
                ? balancedGridLayout(count)
                : calculateBestGridLayout(count, {
                      width: size.width,
                      height: size.height,
                      gap: GRID_GAP,
                      tileAspectRatio: TILE_ASPECT_RATIO,
                  }),
        [isNarrow, size.width, size.height]
    );

    useFittingPageSize(size, tileAspectRatio, getLayout, screenShareTileCount);

    const tileCount = pagedParticipantIdentities.length + screenShareTileCount;

    const { cols, rows } = useMemo(() => getLayout(tileCount), [getLayout, tileCount]);

    const gridStyle = useMemo(() => {
        const base = { gap: `${GRID_GAP}px` };

        if (!size.width || !size.height || !cols || !rows) {
            return { ...base, gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` };
        }

        const cellWidth = (size.width - GRID_GAP * (cols - 1)) / cols;
        const cellHeight = (size.height - GRID_GAP * (rows - 1)) / rows;

        // Narrow: square tiles, centered in both axes.
        if (isNarrow) {
            const tileSize = Math.floor(Math.min(cellWidth, cellHeight));
            return {
                ...base,
                alignContent: 'center',
                gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
            };
        }

        // Wide: 16:9 columns capped so the grid centers horizontally; rows fill the height.
        const tileWidth = Math.floor(Math.min(cellWidth, cellHeight * TILE_ASPECT_RATIO));
        return {
            ...base,
            gridTemplateColumns: `repeat(${cols}, ${tileWidth}px)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
        };
    }, [isNarrow, size.width, size.height, cols, rows]);

    const { viewportWidth } = useActiveBreakpoint();

    const getViewSize = (numberOfTiles: number) => {
        if (viewportWidth.xsmall) {
            return 'small';
        }
        if (viewportWidth['<=small']) {
            return 'medium';
        }

        if (numberOfTiles > 6 || viewportWidth.medium) {
            return 'midLarge';
        }
        return 'large';
    };

    const viewSize = getViewSize(tileCount);

    return (
        <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto h-full">
            <div className="grid justify-center w-full h-full" style={gridStyle}>
                {isScreenShare && <ScreenShareTile />}
                {pagedParticipants.map((participant) => {
                    return <ParticipantTile key={participant.identity} participant={participant} viewSize={viewSize} />;
                })}
            </div>
        </div>
    );
};
