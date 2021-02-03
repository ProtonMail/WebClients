import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';

import { OrderableTable, OrderableTableBody, OrderableTableHeader, Icon } from '../../components';
import LabelSortableItem from './LabelSortableItem';

function LabelSortableList({ items, onEditLabel = noop, onRemoveLabel = noop, ...rest }) {
    return (
        <OrderableTable className="no-border simple-table--has-actions border-collapse mt1" {...rest}>
            <caption className="sr-only">{c('Settings/labels').t`Labels/Folders`}</caption>
            <OrderableTableHeader>
                <tr>
                    <th scope="col" className="w5">
                        <Icon name="arrow-cross" />
                    </th>
                    <th scope="col" className="w70">
                        {c('Settings/labels - table').t`Name`}
                    </th>
                    <th scope="col">{c('Settings/labels - table').t`Actions`}</th>
                </tr>
            </OrderableTableHeader>
            <OrderableTableBody>
                {items.map((label, index) => (
                    <LabelSortableItem
                        key={`item-${index}`}
                        index={index}
                        label={label}
                        onEditLabel={onEditLabel}
                        onRemoveLabel={onRemoveLabel}
                        data-test-id={`folders/labels:item-type:${label.Exclusive ? 'folder' : 'label'}`}
                    />
                ))}
            </OrderableTableBody>
        </OrderableTable>
    );
}

LabelSortableList.propTypes = {
    items: PropTypes.array.isRequired,
    onEditLabel: PropTypes.func,
    onRemoveLabel: PropTypes.func,
};

export default LabelSortableList;
