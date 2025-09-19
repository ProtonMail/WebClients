import { useEffect, useMemo } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';

import type { GridDefinition } from './useGridConfig';
import { useGridConfig } from './useGridConfig';

export type IdentifiableItem = { id: string };

export const useGridVirtualizer = <T extends IdentifiableItem>(definition: GridDefinition, items: T[]) => {
    const config = useGridConfig(definition, items.length);

    const virtualizer = useVirtualizer(
        useMemo(
            () => ({
                count: items.length,
                lanes: config.columns,
                getScrollElement: () => config.container.current,
                estimateSize: () => config.itemHeight + config.gap,
                overscan: 2,
            }),
            [config.columns, config.itemHeight, config.gap, items.length]
        )
    );

    useEffect(() => virtualizer.measure(), [config.columns]);

    return { config, virtualizer };
};
