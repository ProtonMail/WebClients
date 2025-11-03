import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { SortableList } from '@proton/components/components/dnd/SortableList';
import { useSortableListItem } from '@proton/components/components/dnd/SortableListItem';
import Icon from '@proton/components/components/icon/Icon';
import { Handle } from '@proton/components/components/table/Handle';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import ActionsLabel from './ActionsLabel';

const SortableListItem = ({ label }: { label: Label }) => {
    const { isDragging, style, listeners, setNodeRef, attributes } = useSortableListItem({ id: label.ID });

    const { Name, Color } = label;

    return (
        <TableRow
            data-testid="folders/labels:item-type:label"
            ref={setNodeRef}
            style={style}
            className={clsx(isDragging && 'table-row--dragging')}
        >
            <TableCell {...attributes} {...listeners}>
                <Handle />
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
