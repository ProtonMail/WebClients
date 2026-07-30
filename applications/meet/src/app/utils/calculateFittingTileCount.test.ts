import { describe, expect, it } from 'vitest';

import { calculateBestGridLayout } from './calculateBestGridLayout';
import { calculateFittingTileCount } from './calculateFittingTileCount';

// Hardcoded (not imported) so the test is stable if the production MIN_TILE_WIDTH is tuned.
const GAP = 11;
const MIN_TILE_WIDTH = 220;
const TILE_ASPECT_RATIO = 16 / 9;

const fit = (containerWidth: number, containerHeight: number) =>
    calculateFittingTileCount({
        containerWidth,
        containerHeight,
        gap: GAP,
        minTileWidth: MIN_TILE_WIDTH,
        tileAspectRatio: TILE_ASPECT_RATIO,
        maxTiles: 15,
        minTiles: 4,
        getLayout: (count) =>
            calculateBestGridLayout(count, {
                width: containerWidth,
                height: containerHeight,
                gap: GAP,
                tileAspectRatio: TILE_ASPECT_RATIO,
            }),
    });

describe('calculateFittingTileCount', () => {
    it('returns minTiles for a zero-sized container', () => {
        expect(fit(0, 0)).toBe(4);
    });

    it('never returns fewer than minTiles even when tiles would be tiny', () => {
        expect(fit(300, 200)).toBe(4);
    });

    it('never returns more than maxTiles on a very large container', () => {
        expect(fit(5000, 3000)).toBe(15);
    });

    it('fits more tiles on a wide-but-short screen instead of collapsing to the minimum', () => {
        const count = fit(2400, 450);
        expect(count).toBeGreaterThan(4);
        expect(count).toBeLessThanOrEqual(15);
    });

    it('scales the count with the available area', () => {
        expect(fit(1800, 1000)).toBeGreaterThan(fit(900, 600));
    });
});
