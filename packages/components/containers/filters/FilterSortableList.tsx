import { c } from 'ttag';

import { SortableList } from '@proton/components/components/dnd/SortableList';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';

import FilterItemRow from './FilterItemRow';
import type { Filter } from './interfaces';

interface Props {
    items: Filter[];
    onApplyFilter: (filterID: string) => void;
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
}

const FilterSortableList = ({ items, onApplyFilter, onSortEnd, ...rest }: Props) => {
    const itemIds = items.map((item) => item.ID);

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
            <TableBody colSpan={0}>
                <SortableList onSortEnd={onSortEnd} items={itemIds}>
                    {items.map((filter) => (
                        <FilterItemRow
                            key={`item-${filter.ID}`}
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
