import React from 'react';
import PropTypes from 'prop-types';
import { SortableElement } from 'react-sortable-hoc';
import { noop } from 'proton-shared/lib/helpers/function';
import { Icon } from 'react-components';

import ToggleNotify from './ToggleNotify';
import ActionsLabel from './ActionsLabel';

function LabelItem({ label, onEditLabel, onRemoveLabel }) {
    const { Name, Color, Exclusive } = label;

    const handleChange = (type, label) => {
        type === 'update' && onEditLabel(label);
        type === 'remove' && onRemoveLabel(label);
    };

    return (
        <tr>
            <td>
                <Icon name="text-justify" />
            </td>
            <td>
                {Exclusive === 1 && <Icon name="folder" style={{ fill: Color }} className="icon-16p mr1" alt={Name} />}
                {Exclusive === 0 && <Icon name="label" style={{ fill: Color }} className="icon-16p mr1" alt={Name} />}
                <span>{Name}</span>
            </td>
            <td>
                <div className="w10">{Exclusive === 1 && <ToggleNotify label={label} />}</div>
            </td>
            <td>
                <ActionsLabel label={label} onChange={handleChange} />
            </td>
        </tr>
    );
}

LabelItem.propTypes = {
    label: PropTypes.object.isRequired,
    onToggleChange: PropTypes.func,
    onEditLabel: PropTypes.func,
    onRemoveLabel: PropTypes.func
};

LabelItem.defaultProps = {
    onToggleChange: noop,
    onEditLabel: noop,
    onRemoveLabel: noop
};

export default SortableElement(LabelItem);
