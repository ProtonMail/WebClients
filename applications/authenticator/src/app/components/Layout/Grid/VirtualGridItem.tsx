import type { PropsWithChildren } from 'react';

import { useSortable } from '@dnd-kit/react/sortable';
import { closestCenter } from '@dnd-kit/collision';
import type { VirtualItem } from '@tanstack/react-virtual';

import type { GridConfiguration } from './hooks/useGridConfig';

type Props = {
    index: number;
    id: string;
    config: GridConfiguration;
    virtualItem: Pick<VirtualItem, 'start' | 'lane'>;
    disabled?: boolean;
};

export const VirtualGridItem = ({ index, id, config, children, virtualItem, disabled }: PropsWithChildren<Props>) => {
    const { ref, isDragging } = useSortable({ id, index, disabled, collisionDetector: closestCenter });

    const style = {
        height: '100%',
        position: 'absolute',
        width: '100%',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: virtualItem.start,
                left: virtualItem.lane * (config.itemWidth + config.gap),
                width: config.itemWidth,
                height: config.itemHeight,
            }}
        >
            <div ref={ref} style={style}>
                {children}
            </div>
        </div>
    );
};
