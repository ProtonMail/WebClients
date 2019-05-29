import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SortableContainer } from 'react-sortable-hoc';
import { Icon, Table } from 'react-components';

import FilterItemRow from './FilterItemRow';

function FilterSortableList({ items }) {
    return (
        <Table className="noborder border-collapse mt1">
            <caption className="sr-only">{c('Settings/filters').t`Filters`}</caption>
            <thead>
                <tr>
                    <th scope="col" className="w5">
                        <Icon name="what-is-this" />
                    </th>
                    <th scope="col" className="w45">
                        {c('Settings/filters - table').t`Name`}
                    </th>
                    <th scope="col" className="w15">
                        {c('Settings/filters - table').t`Status`}
                    </th>
                    <th scope="col" className="w30">
                        {c('Settings/filters - table').t`Action`}
                    </th>
                </tr>
            </thead>
            <tbody>
                {items.map((filter, index) => (
                    <FilterItemRow key={`item-${index}`} index={index} filter={filter} />
                ))}
            </tbody>
        </Table>
    );
}

FilterSortableList.propTypes = {
    items: PropTypes.array.isRequired
};

export default SortableContainer(FilterSortableList);
