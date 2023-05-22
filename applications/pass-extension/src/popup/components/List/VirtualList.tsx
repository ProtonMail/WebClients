import { type ForwardRefRenderFunction, type RefObject, forwardRef, useCallback, useEffect, useState } from 'react';
import type { ListRowRenderer, ScrollParams } from 'react-virtualized';
import { AutoSizer, List } from 'react-virtualized';

import clsx from '@proton/utils/clsx';

import './VirtualList.scss';

type Props = {
    rowRenderer: ListRowRenderer;
    rowCount: number;
    interpolationIndexes?: number[];
};

const VirtualListRender: ForwardRefRenderFunction<List, Props> = (
    { rowRenderer, rowCount, interpolationIndexes = [] },
    virtualListRef
) => {
    const [shadows, setShadows] = useState({ top: false, bottom: false });

    const handleScroll = useCallback(({ scrollTop, clientHeight, scrollHeight }: ScrollParams) => {
        const scrollable = clientHeight > 0 && scrollHeight > clientHeight;

        setShadows({
            top: scrollable && scrollTop > 0 && scrollHeight > clientHeight,
            bottom: scrollable && scrollTop + clientHeight < scrollHeight,
        });
    }, []);

    useEffect(() => {
        (virtualListRef as RefObject<List>).current?.recomputeRowHeights();
    }, [interpolationIndexes]);

    return (
        <div className="h100 scroll-outer-vertical">
            <div
                className={clsx('scroll-start-shadow no-pointer-events', shadows.top && 'scroll-start-shadow-visible')}
                aria-hidden="true"
            />
            <div
                className={clsx('scroll-end-shadow no-pointer-events', shadows.bottom && 'scroll-end-shadow-visible')}
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
                        rowHeight={({ index }) => (interpolationIndexes.includes(index) ? 28 : 54)}
                    />
                )}
            </AutoSizer>
        </div>
    );
};

export const VirtualList = forwardRef(VirtualListRender);
