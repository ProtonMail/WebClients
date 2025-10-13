import type { ReactNode } from 'react';

import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import Icon from '@proton/components/components/icon/Icon';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import TableRow from '../../components/table/TableRow';
import ActionsLabel from './ActionsLabel';

const SortableListItem = ({ label }: { label: Label }) => {
    const { isDragging, attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: label.ID });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const { Name, Color } = label;

    return (
        <TableRow data-testid="folders/labels:item-type:label" ref={setNodeRef} style={style}>
            <TableCell {...attributes} {...listeners}>
                <span className="flex" data-testid="table:order-icon">
                    <Icon className="my-auto cursor-grab color-hint" name="dots" />
                </span>
            </TableCell>
            <TableCell>
                <div key="label" className="flex flex-nowrap">
                    <Icon name="tag" style={{ fill: Color }} className="icon-size-4 shrink-0 mr-4 my-auto" />
                    <span className="text-ellipsis" title={Name} data-testid="folders/labels:item-name">
                        {Name}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <ActionsLabel key="actions" label={label} />
            </TableCell>
        </TableRow>
    );
};

const SortableList = ({
    onSortEnd,
    children,
    items,
}: {
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
    onActiveId?: (id: string | null) => void;
    children: ReactNode;
    items: string[];
}) => {
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (typeof active.id === 'string' && typeof over?.id === 'string' && active.id !== over.id) {
            onSortEnd?.({ oldIndex: items.indexOf(active.id), newIndex: items.indexOf(over.id) });
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </DndContext>
    );
};

interface Props {
    items: Label[];
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
}

const LabelSortableList = ({ items, onSortEnd }: Props) => {
    const itemIds = items.map((item) => item.ID);

    return (
        <Scroll className={clsx('overflow-hidden', items.length > 17 && 'h-custom')} style={{ '--h-custom': '50rem' }}>
            <Table responsive="cards" className="border-none simple-table--has-actions border-collapse mt-4">
                <caption className="sr-only">{c('Settings/labels').t`Labels/Folders`}</caption>
                <TableHeader>
                    <tr>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '5%' }}>
                            <Icon name="arrows-cross" alt={c('Settings/labels - table').t`Drag to reorder`} />
                        </th>
                        <th scope="col">{c('Settings/labels - table').t`Labels`}</th>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '10em' }}>
                            {c('Settings/labels - table').t`Actions`}
                        </th>
                    </tr>
                </TableHeader>
                <TableBody colSpan={0}>
                    <SortableList onSortEnd={onSortEnd} items={itemIds}>
                        {items.map((label) => (
                            <SortableListItem key={label.ID} label={label} />
                        ))}
                    </SortableList>
                </TableBody>
            </Table>
        </Scroll>
    );
};

export default LabelSortableList;
