import {
    type ForwardRefRenderFunction,
    type RefObject,
    forwardRef,
    useCallback,
    useLayoutEffect,
    useState,
} from 'react';
import type { ListRowRenderer, ScrollParams } from 'react-virtualized';
import { AutoSizer, List } from 'react-virtualized';

import clsx from '@proton/utils/clsx';

import './VirtualList.scss';

type Props = {
    interpolationIndexes?: number[];
    rowCount: number;
    onScrollEnd?: () => void;
    rowHeight: (index: number) => number;
    rowRenderer: ListRowRenderer;
};

const VirtualListRender: ForwardRefRenderFunction<List, Props> = (
    { interpolationIndexes = [], rowCount, rowHeight, onScrollEnd, rowRenderer },
    virtualListRef
) => {
    const [shadows, setShadows] = useState({ top: false, bottom: false });

    const handleScroll = useCallback(
        ({ scrollTop, clientHeight, scrollHeight }: ScrollParams) => {
            const scrollable = clientHeight > 0 && scrollHeight > clientHeight;

            if (scrollTop + clientHeight >= scrollHeight) onScrollEnd?.();

            setShadows({
                top: scrollable && scrollTop > 0 && scrollHeight > clientHeight,
                bottom: scrollable && scrollTop + clientHeight < scrollHeight,
            });
        },
        [onScrollEnd]
    );

    useLayoutEffect(() => {
        const ref = virtualListRef as RefObject<List>;
        ref.current?.recomputeRowHeights();
        ref.current?.measureAllRows();
    }, [interpolationIndexes, rowCount]);

    return (
        <div className="h-full scroll-outer-vertical">
            <div
                className={clsx(
                    'scroll-start-shadow pointer-events-none',
                    shadows.top && 'scroll-start-shadow-visible'
                )}
                aria-hidden="true"
            />
            <div
                className={clsx('scroll-end-shadow pointer-events-none', shadows.bottom && 'scroll-end-shadow-visible')}
                aria-hidden="true"
            />

            <AutoSizer>
                {({ height, width }) => (
                    <List
                        className="unstyled m-0"
                        style={{ overflowY: 'overlay' }}
                        ref={virtualListRef}
                        onScroll={handleScroll}
                        onScrollbarPresenceChange={({ vertical }) => setShadows({ top: false, bottom: vertical })}
                        rowRenderer={rowRenderer}
                        rowCount={rowCount}
                        height={height}
                        width={width - 1} /* account for react-virtualized ceiling */
                        rowHeight={({ index }) => rowHeight(index)}
                    />
                )}
            </AutoSizer>
        </div>
    );
};

export const VirtualList = forwardRef(VirtualListRender);
