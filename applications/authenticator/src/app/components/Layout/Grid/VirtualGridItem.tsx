import type { PropsWithChildren } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { VirtualItem } from '@tanstack/react-virtual';

import type { GridConfiguration } from './hooks/useGridConfig';

type Props = {
    id: string;
    config: GridConfiguration;
    virtualItem: Pick<VirtualItem, 'start' | 'lane'>;
    disabled?: boolean;
};

export const VirtualGridItem = ({ id, config, children, virtualItem, disabled }: PropsWithChildren<Props>) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
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
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                {children}
            </div>
        </div>
    );
};
