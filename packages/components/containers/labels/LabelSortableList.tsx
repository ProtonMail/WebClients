import { useRef } from 'react';

import { useSortable } from '@dnd-kit/react/sortable';
import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';
import { IcTag } from '@proton/icons/icons/IcTag';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import { SortableList } from '../../components/dnd/SortableList';
import { Handle } from '../../components/table/Handle';
import Table from '../../components/table/Table';
import TableBody from '../../components/table/TableBody';
import TableCell from '../../components/table/TableCell';
import TableHeader from '../../components/table/TableHeader';
import TableRow from '../../components/table/TableRow';
import { getSettingsCardTableProps } from '../account/getSettingsCardTableProps';
import { SettingsLayoutVariant } from '../layout/interface';
import ActionsLabel from './ActionsLabel';

const SortableListItem = ({ label, index }: { label: Label; index: number }) => {
    const { isDragging, ref: sortableRef, handleRef } = useSortable({ id: label.ID, index });

    const { Name, Color } = label;

    return (
        <TableRow data-testid="folders/labels:item-type:label" ref={sortableRef} dragging={isDragging}>
            <TableCell ref={handleRef}>
                <Handle />
            </TableCell>
            <TableCell>
                <div key="label" className="flex flex-nowrap">
                    <IcTag style={{ fill: Color }} className="icon-size-4 shrink-0 mr-4 my-auto" />
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

interface Props {
    items: Label[];
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
    /** The card variant styles the table to fill a flush settings card. */
    variant?: SettingsLayoutVariant;
}

const LabelSortableList = ({ items, onSortEnd, variant }: Props) => {
    const containerRef = useRef<HTMLTableSectionElement>(null);
    const cardTable = variant === SettingsLayoutVariant.Card ? getSettingsCardTableProps() : undefined;

    return (
        <Scroll className={clsx('overflow-hidden', items.length > 17 && 'h-custom')} style={{ '--h-custom': '50rem' }}>
            <Table
                responsive="cards"
                hasActions
                {...cardTable}
                className={clsx('border-none border-collapse', cardTable?.className ?? 'mt-4')}
            >
                <caption className="sr-only">{c('Settings/labels').t`Labels/Folders`}</caption>
                <TableHeader>
                    <tr>
                        {/* The card table pads cells more: keep room for the drag icon */}
                        <th scope="col" className="w-custom" style={{ '--w-custom': cardTable ? '3rem' : '5%' }}>
                            <IcArrowsCross alt={c('Settings/labels - table').t`Drag to reorder`} />
                        </th>
                        <th scope="col">{c('Settings/labels - table').t`Labels`}</th>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '10em' }}>
                            {c('Settings/labels - table').t`Actions`}
                        </th>
                    </tr>
                </TableHeader>
                <TableBody colSpan={0} ref={containerRef}>
                    <SortableList onSortEnd={onSortEnd} containerRef={containerRef}>
                        {items.map((label, index) => (
                            <SortableListItem key={label.ID} label={label} index={index} />
                        ))}
                    </SortableList>
                </TableBody>
            </Table>
        </Scroll>
    );
};

export default LabelSortableList;
