import { describe, expect, it } from 'vitest';

import { GRID_GAP, TILE_ASPECT_RATIO, balancedGridLayout, calculateBestGridLayout } from './calculateBestGridLayout';

const layout = (count: number, width: number, height: number) =>
    calculateBestGridLayout(count, { width, height, gap: GRID_GAP, tileAspectRatio: TILE_ASPECT_RATIO });

/** Narrow screens render square tiles. */
const squareLayout = (count: number, width: number, height: number) =>
    calculateBestGridLayout(count, { width, height, gap: GRID_GAP, tileAspectRatio: 1 });

describe('calculateBestGridLayout', () => {
    it('handles empty and single-tile cases', () => {
        expect(layout(0, 1000, 800)).toEqual({ cols: 0, rows: 0 });
        expect(layout(1, 1000, 800)).toEqual({ cols: 1, rows: 1 });
    });

    it('uses a single row for a wide, short area', () => {
        expect(layout(5, 3440, 400)).toEqual({ cols: 5, rows: 1 });
    });

    it('stacks tiles vertically on a tall, narrow (portrait) area', () => {
        expect(layout(2, 400, 900)).toEqual({ cols: 1, rows: 2 });
    });

    it('uses a balanced arrangement on a roughly 16:9 area', () => {
        expect(layout(4, 1600, 900)).toEqual({ cols: 2, rows: 2 });
    });

    it('spreads a large group across columns (5×3) rather than adding a 4th row', () => {
        expect(layout(15, 1600, 900)).toEqual({ cols: 5, rows: 3 });
    });

    it('falls back to a square-ish layout before the container is measured', () => {
        expect(layout(5, 0, 0)).toEqual({ cols: 3, rows: 2 });
    });

    it('keeps stacking a pair as the window narrows below the desktop breakpoint', () => {
        expect(layout(2, 1200, 700)).toEqual({ cols: 1, rows: 2 });
        expect(layout(2, 900, 700)).toEqual({ cols: 1, rows: 2 });
        expect(layout(2, 700, 700)).toEqual({ cols: 1, rows: 2 });
    });

    describe('with square tiles (phone widths)', () => {
        it('stacks a pair on a tall area rather than shrinking it side by side', () => {
            expect(squareLayout(2, 390, 700)).toEqual({ cols: 1, rows: 2 });
        });

        it('puts a pair side by side once the area is wide and short', () => {
            expect(squareLayout(2, 660, 320)).toEqual({ cols: 2, rows: 1 });
        });
    });
});

describe('balancedGridLayout', () => {
    it('arranges four tiles as a 2×2 grid', () => {
        expect(balancedGridLayout(4)).toEqual({ cols: 2, rows: 2 });
    });

    it('returns an empty layout for no tiles', () => {
        expect(balancedGridLayout(0)).toEqual({ cols: 0, rows: 0 });
    });
});
