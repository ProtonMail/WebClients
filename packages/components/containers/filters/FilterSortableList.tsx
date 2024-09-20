import type { ContainerGetter, SortEndHandler } from 'react-sortable-hoc';

import { c } from 'ttag';

import OrderableTable from '@proton/components/components/orderableTable/OrderableTable';
import OrderableTableBody from '@proton/components/components/orderableTable/OrderableTableBody';
import OrderableTableHeader from '@proton/components/components/orderableTable/OrderableTableHeader';

import FilterItemRow from './FilterItemRow';
import type { Filter } from './interfaces';

interface Props {
    items: Filter[];
    getContainer: ContainerGetter;
    onSortEnd: SortEndHandler;
    onApplyFilter: (filterID: string) => void;
}

const FilterSortableList = ({ items, onApplyFilter, ...rest }: Props) => (
    <OrderableTable className="border-none border-collapse mt-4 simple-table--has-actions" {...rest}>
        <caption className="sr-only">{c('Settings/filters').t`Filters`}</caption>
        <OrderableTableHeader>
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
        </OrderableTableHeader>
        <OrderableTableBody colSpan={0}>
            {items.map((filter, index) => (
                <FilterItemRow
                    key={`item-${index}`}
                    index={index}
                    filter={filter}
                    filters={items}
                    onApplyFilter={onApplyFilter}
                />
            ))}
        </OrderableTableBody>
    </OrderableTable>
);

export default FilterSortableList;
