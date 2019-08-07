import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { OrderableTable, OrderableTableHeader, OrderableTableBody } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import LabelSortableItem from './LabelSortableItem';

function LabelSortableList({ items, onEditLabel, onRemoveLabel, ...rest }) {
    return (
        <OrderableTable className="noborder border-collapse mt1" {...rest}>
            <caption className="sr-only">{c('Settings/labels').t`Labels/Folders`}</caption>
            <OrderableTableHeader>
                <tr>
                    <th scope="col" className="w5" />
                    <th scope="col" className="w45">
                        {c('Settings/labels - table').t`Name`}
                    </th>
                    <th scope="col" className="w15">
                        {c('Settings/labels - table').t`Notification`}
                    </th>
                    <th scope="col" className="w30">
                        {c('Settings/labels - table').t`Actions`}
                    </th>
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
    onToggleChange: PropTypes.func
};

LabelSortableList.defaultProps = {
    onEditLabel: noop,
    onRemoveLabel: noop,
    onToggleChange: noop
};

export default LabelSortableList;
