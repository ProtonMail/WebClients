import type { ScriptableContext } from 'chart.js';

/**
 * A small helper tool to paint the linechart in two different colors
 * When data points are above the threshold, paint them in the "above" color
 * When data points are below the threshold, paint them in the "below" color
 */
export const splitAtThreshold =
    (threshold: number | undefined, below: string, above: string) =>
    ({ chart: { ctx, chartArea, scales } }: ScriptableContext<'line'>) => {
        if (threshold === undefined || chartArea === undefined) {
            return below;
        }

        const { top, bottom } = chartArea;
        const y = scales.y?.getPixelForValue(threshold);
        if (y === undefined || bottom <= top) {
            return below;
        }

        const boundary = Math.min(1, Math.max(0, (y - top) / (bottom - top)));
        const gradient = ctx.createLinearGradient(0, top, 0, bottom);
        gradient.addColorStop(0, above);
        gradient.addColorStop(boundary, above);
        gradient.addColorStop(boundary, below);
        gradient.addColorStop(1, below);

        return gradient;
    };
