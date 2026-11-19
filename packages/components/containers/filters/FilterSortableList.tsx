import type { CSSProperties } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import type { Filter } from '@proton/sieve/filterModel';
import clsx from '@proton/utils/clsx';

import { SortableList } from '../../components/dnd/SortableList';
import Table from '../../components/table/Table';
import TableBody from '../../components/table/TableBody';
import TableHeader from '../../components/table/TableHeader';
import { getSettingsCardTableProps } from '../account/getSettingsCardTableProps';
import { SettingsLayoutVariant } from '../layout/interface';
import FilterItemRow from './FilterItemRow';

// Inline, as the table's own header cell padding and border win over utility classes
const hiddenHeaderCell: CSSProperties = { padding: 0, border: 'none' };

interface Props {
    items: Filter[];
    onApplyFilter: (filterID: string) => void;
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
    /** The card variant styles the table to fill a flush settings card. */
    variant?: SettingsLayoutVariant;
}

const FilterSortableList = ({ items, onApplyFilter, onSortEnd, variant, ...rest }: Props) => {
    const containerRef = useRef<HTMLTableSectionElement>(null);
    const cardTable = variant === SettingsLayoutVariant.Card ? getSettingsCardTableProps() : undefined;

    return (
        <Table
            hasActions={true}
            responsive="cards"
            {...cardTable}
            className={clsx('border-none border-collapse', cardTable?.className ?? 'mt-4')}
            {...rest}
        >
            <caption className="sr-only">{c('Settings/filters').t`Filters`}</caption>
            {/* The column names are for screen readers only. The row stays in the layout, at zero height and with no
                border, so its cells still set the column widths of the fixed table layout */}
            <TableHeader>
                <tr>
                    <th
                        scope="col"
                        className="w-custom"
                        style={{ ...hiddenHeaderCell, '--w-custom': cardTable ? '3rem' : '5%' }}
                    >
                        <span className="sr-only">{c('Settings/filters - table').t`Order`}</span>
                    </th>
                    <th scope="col" style={hiddenHeaderCell}>
                        <span className="sr-only">{c('Settings/filters - table').t`Name`}</span>
                    </th>
                    <th scope="col" className="w-custom" style={{ ...hiddenHeaderCell, '--w-custom': '10em' }}>
                        <span className="sr-only">{c('Settings/filters - table').t`Action`}</span>
                    </th>
                </tr>
            </TableHeader>
            <TableBody colSpan={0} ref={containerRef}>
                <SortableList onSortEnd={onSortEnd} containerRef={containerRef}>
                    {items.map((filter, index) => (
                        <FilterItemRow
                            key={`item-${filter.ID}`}
                            index={index}
                            filter={filter}
                            filters={items}
                            onApplyFilter={onApplyFilter}
                        />
                    ))}
                </SortableList>
            </TableBody>
        </Table>
    );
};

export default FilterSortableList;
