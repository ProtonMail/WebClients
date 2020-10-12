import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { OrderableTable, OrderableTableHeader, OrderableTableBody } from '../../components';

import FilterItemRow from './FilterItemRow';

const FilterSortableList = ({ items, ...rest }) => (
    <OrderableTable className="noborder border-collapse mt1 pm-simple-table--has-actions" {...rest}>
        <caption className="sr-only">{c('Settings/filters').t`Filters`}</caption>
        <OrderableTableHeader>
            <tr>
                <th scope="col" className="w5">
                    <span className="sr-only">{c('Settings/filters - table').t`Order`}</span>
                </th>
                <th scope="col">{c('Settings/filters - table').t`Name`}</th>
                <th scope="col" className="w8e nomobile">
                    {c('Settings/filters - table').t`Status`}
                </th>
                <th scope="col" className="w10e">
                    {c('Settings/filters - table').t`Action`}
                </th>
            </tr>
        </OrderableTableHeader>
        <OrderableTableBody>
            {items.map((filter, index) => (
                <FilterItemRow key={`item-${index}`} index={index} filter={filter} />
            ))}
        </OrderableTableBody>
    </OrderableTable>
);

FilterSortableList.propTypes = {
    items: PropTypes.array.isRequired,
};

export default FilterSortableList;
