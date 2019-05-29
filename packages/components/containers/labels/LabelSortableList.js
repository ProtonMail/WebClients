import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SortableContainer } from 'react-sortable-hoc';
import { Icon, Table } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import LabelSortableItem from './LabelSortableItem';

function LabelSortableList({ items, onEditLabel, onRemoveLabel, onToggleChange }) {
    return (
        <Table className="noborder border-collapse mt1">
            <caption className="sr-only">{c('Settings/labels').t`Labels/Folders`}</caption>
            <thead>
                <tr>
                    <th scope="col" className="w5">
                        <Icon name="what-is-this" />
                    </th>
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
            </thead>
            <tbody>
                {items.map((label, index) => (
                    <LabelSortableItem
                        key={`item-${index}`}
                        index={index}
                        label={label}
                        onToggleChange={onToggleChange}
                        onEditLabel={onEditLabel}
                        onRemoveLabel={onRemoveLabel}
                        helperClass="LabelSortableItem-item"
                    />
                ))}
            </tbody>
        </Table>
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

export default SortableContainer(LabelSortableList);
