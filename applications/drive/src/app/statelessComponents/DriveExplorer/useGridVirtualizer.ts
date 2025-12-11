import { useEffect, useMemo } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';

import { defaultConfig } from './constants';

export interface VirtualizedGridConfig {
    itemsPerRow: number;
    rowHeight: number;
    overscan?: number;
    gap?: number;
}

export const useGridVirtualizer = (
    config: VirtualizedGridConfig,
    container: React.RefObject<HTMLElement | null>,
    itemCount: number
) => {
    const rowCount = Math.ceil(itemCount / config.itemsPerRow);

    const virtualizer = useVirtualizer(
        useMemo(
            () => ({
                count: rowCount,
                getScrollElement: () => container.current,
                estimateSize: () => config.rowHeight,
                overscan: config.overscan || defaultConfig.overscan,
                gap: config.gap || defaultConfig.gap,
            }),
            [rowCount, config.rowHeight, config.overscan, config.gap, container]
        )
    );

    useEffect(() => {
        if (container.current) {
            virtualizer.measure();
        }
    }, [virtualizer, container, config.rowHeight, config.itemsPerRow]);

    return virtualizer;
};
