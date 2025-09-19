import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { MaybeNull } from '@proton/pass/types';

export type GridDefinition = {
    itemHeight: number;
    initialWidth?: number;
    gap: number;
    columns: Record<number, number>;
};

export type GridConfiguration = {
    container: MutableRefObject<MaybeNull<HTMLDivElement>>;
    gap: number;
    width: number;
    itemWidth: number;
    itemHeight: number;
    columns: number;
    rows: number;
};

export const useGridConfig = (definition: GridDefinition, itemCount: number) => {
    const [width, setWidth] = useState(definition.initialWidth ?? 0);
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current) return;

        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(container.current);

        return () => observer.disconnect();
    }, []);

    const config = useMemo<GridConfiguration>(() => {
        const { itemHeight, gap } = definition;

        const sortedBreakpoints = Object.keys(definition.columns)
            .map((val) => parseInt(val, 10))
            .sort((a, b) => b - a);

        const breakpoint = sortedBreakpoints.find((bp) => width >= bp);
        const defaultBreakpoint = sortedBreakpoints[sortedBreakpoints.length - 1];

        const columns = definition.columns[breakpoint ?? defaultBreakpoint ?? 1];
        const itemWidth = width > 0 ? (width - gap * (columns - 1)) / columns : 0;
        const rows = Math.ceil(itemCount / columns);

        return { container, gap, rows, columns, width, itemWidth, itemHeight };
    }, [width, definition, itemCount]);

    return config;
};
