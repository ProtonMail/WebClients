import { useEffect, useMemo } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';

import { defaultConfig } from './constants';

export interface VirtualizedListConfig {
    itemHeight?: number;
    overscan?: number;
    gap?: number;
}

export const useListVirtualizer = (
    config: VirtualizedListConfig,
    container: React.RefObject<HTMLElement | null>,
    itemCount: number
) => {
    const virtualizer = useVirtualizer(
        useMemo(
            () => ({
                count: itemCount,
                getScrollElement: () => container.current,
                estimateSize: () => config.itemHeight || defaultConfig.itemHeight,
                overscan: config.overscan || defaultConfig.overscan,
                gap: config.gap || defaultConfig.gap,
            }),
            [itemCount, config.itemHeight, config.overscan, config.gap, container]
        )
    );

    useEffect(() => {
        if (container.current) {
            virtualizer.measure();
        }
    }, [virtualizer, container]);

    return virtualizer;
};
