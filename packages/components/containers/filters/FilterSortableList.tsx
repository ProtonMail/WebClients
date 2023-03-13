import { ContainerGetter, SortEndHandler } from 'react-sortable-hoc';

import { c } from 'ttag';

import { OrderableTable, OrderableTableBody, OrderableTableHeader } from '../../components';
import FilterItemRow from './FilterItemRow';
import { Filter } from './interfaces';

interface Props {
    items: Filter[];
    getContainer: ContainerGetter;
    onSortEnd: SortEndHandler;
    onApplyFilter: (filterID: string) => void;
}

const FilterSortableList = ({ items, onApplyFilter, ...rest }: Props) => (
    <OrderableTable className="border-none border-collapse mt1 simple-table--has-actions" {...rest}>
        <caption className="sr-only">{c('Settings/filters').t`Filters`}</caption>
        <OrderableTableHeader>
            <tr>
                <th scope="col" className="w5">
                    <span className="sr-only">{c('Settings/filters - table').t`Order`}</span>
                </th>
                <th scope="col">{c('Settings/filters - table').t`Name`}</th>
                <th scope="col" className="w8e no-mobile">
                    {c('Settings/filters - table').t`Status`}
                </th>
                <th scope="col" className="w10e">
                    {c('Settings/filters - table').t`Action`}
                </th>
            </tr>
        </OrderableTableHeader>
        <OrderableTableBody colSpan={0}>
            {items.map((filter, index) => (
                <FilterItemRow key={`item-${index}`} index={index} filter={filter} onApplyFilter={onApplyFilter} />
            ))}
        </OrderableTableBody>
    </OrderableTable>
);

export default FilterSortableList;
