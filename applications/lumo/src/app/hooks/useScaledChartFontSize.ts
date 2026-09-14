import { useMemo } from 'react';

import { useTheme } from '@proton/components';

import { scaleChartFontSize } from '../util/scaleChartFontSize';

const DEFAULT_AXIS_TICK_FILL = 'var(--text-weak)';

export interface ScaledChartAxisTick {
    fontSize: number;
    fill: string;
}

export const useScaledChartFontSize = (
    designPx: number,
    fill: string = DEFAULT_AXIS_TICK_FILL
): ScaledChartAxisTick => {
    const { settings } = useTheme();

    return useMemo(() => {
        return {
            fontSize: scaleChartFontSize(designPx, true),
            fill,
        };
    }, [designPx, fill, settings.FontSize]);
};
