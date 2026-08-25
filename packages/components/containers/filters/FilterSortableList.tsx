import { useRef } from 'react';

import { c } from 'ttag';

import type { Filter } from '@proton/sieve/filterModel';

import { SortableList } from '../../components/dnd/SortableList';
import Table from '../../components/table/Table';
import TableBody from '../../components/table/TableBody';
import TableHeader from '../../components/table/TableHeader';
import FilterItemRow from './FilterItemRow';

interface Props {
    items: Filter[];
    onApplyFilter: (filterID: string) => void;
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
}

const FilterSortableList = ({ items, onApplyFilter, onSortEnd, ...rest }: Props) => {
    const containerRef = useRef<HTMLTableSectionElement>(null);

    return (
        <Table hasActions={true} responsive="cards" className="border-none border-collapse mt-4" {...rest}>
            <caption className="sr-only">{c('Settings/filters').t`Filters`}</caption>
            <TableHeader>
                <tr>
                    <th scope="col" className="w-custom" style={{ '--w-custom': '5%' }}>
                        <span className="sr-only">{c('Settings/filters - table').t`Order`}</span>
                    </th>
                    <th scope="col">
                        <span className="sr-only">{c('Settings/filters - table').t`Name`}</span>
                    </th>
                    <th scope="col" className="w-custom" style={{ '--w-custom': '10em' }}>
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
