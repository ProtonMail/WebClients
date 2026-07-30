interface FittingTileParams {
    containerWidth: number;
    containerHeight: number;
    gap: number;
    minTileWidth: number;
    tileAspectRatio: number;
    maxTiles: number;
    minTiles: number;
    /** The column/row arrangement the grid will actually render for a given tile count. */
    getLayout: (count: number) => { cols: number; rows: number };
}

/**
 * How many tiles fit without any shrinking below `minTileWidth`, clamped to [minTiles, maxTiles].
 * Evaluated against the same arrangement the grid renders (`getLayout`); since adding tiles never
 * enlarges them, we stop at the first count that no longer fits.
 */
export const calculateFittingTileCount = ({
    containerWidth,
    containerHeight,
    gap,
    minTileWidth,
    tileAspectRatio,
    maxTiles,
    minTiles,
    getLayout,
}: FittingTileParams): number => {
    if (containerWidth <= 0 || containerHeight <= 0) {
        return minTiles;
    }

    let best = minTiles;

    for (let count = minTiles + 1; count <= maxTiles; count++) {
        const { cols, rows } = getLayout(count);
        const cellWidth = (containerWidth - gap * (cols - 1)) / cols;
        const cellHeight = (containerHeight - gap * (rows - 1)) / rows;
        const tileWidth = Math.min(cellWidth, cellHeight * tileAspectRatio);

        if (tileWidth < minTileWidth) {
            break;
        }

        best = count;
    }

    return best;
};
