import { rootFontSize } from '@proton/shared/lib/helpers/dom';

/** Matches `@proton/styles` `$root-default-font-size` used by the `rem()` Sass helper. */
export const CHART_FONT_ROOT_PX = 16;

/**
 * Scale a design-time px font size to match rem-based UI typography at the current root font size.
 */
export const scaleChartFontSize = (designPx: number, resetCache = false): number => {
    const root = rootFontSize(resetCache);
    const effectiveRoot = Number.isFinite(root) && root > 0 ? root : CHART_FONT_ROOT_PX;

    return (designPx / CHART_FONT_ROOT_PX) * effectiveRoot;
};
