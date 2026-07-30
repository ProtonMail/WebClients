export const GRID_GAP = 11; // 0.6875rem in px
export const TILE_ASPECT_RATIO = 16 / 9;
export const MIN_TILE_WIDTH = 200;
// Classic ceiling of 3 rows: large groups spread across columns (e.g. 15 → 5×3) instead of stacking a 4th row.
export const MAX_GRID_ROWS = 3;

interface GridLayoutParams {
    width: number;
    height: number;
    gap: number;
    tileAspectRatio: number;
}

/** A roughly square arrangement (e.g. 4 → 2×2), independent of container shape. */
export const balancedGridLayout = (count: number): { cols: number; rows: number } => {
    if (count <= 0) {
        return { cols: 0, rows: 0 };
    }
    const cols = Math.ceil(Math.sqrt(count));
    return { cols, rows: Math.ceil(count / cols) };
};

/** Picks the column/row arrangement that yields the largest tiles for the given container shape. */
export const calculateBestGridLayout = (
    count: number,
    { width, height, gap, tileAspectRatio }: GridLayoutParams
): { cols: number; rows: number } => {
    if (count <= 0) {
        return { cols: 0, rows: 0 };
    }

    // Not yet measured: fall back to a roughly square arrangement.
    if (width <= 0 || height <= 0) {
        return balancedGridLayout(count);
    }

    // Aspect ratio is fixed across candidates, so the widest tile is also the largest.
    let best = { cols: 1, rows: count, tileWidth: -1 };

    for (let cols = 1; cols <= count; cols++) {
        const rows = Math.ceil(count / cols);
        if (rows > MAX_GRID_ROWS) {
            continue;
        }

        const cellWidth = (width - gap * (cols - 1)) / cols;
        const cellHeight = (height - gap * (rows - 1)) / rows;

        if (cellWidth <= 0 || cellHeight <= 0) {
            continue;
        }

        const tileWidth = Math.min(cellWidth, cellHeight * tileAspectRatio);

        if (tileWidth > best.tileWidth) {
            best = { cols, rows, tileWidth };
        }
    }

    return { cols: best.cols, rows: best.rows };
};
