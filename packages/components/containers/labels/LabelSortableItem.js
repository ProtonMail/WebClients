import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { OrderableTableRow, Icon } from 'react-components';

import ToggleNotify from './ToggleNotify';
import ActionsLabel from './ActionsLabel';

function LabelItem({ label, onEditLabel = noop, onRemoveLabel = noop, ...rest }) {
    const { Name, Color, Exclusive } = label;

    const handleChange = (type, label) => {
        type === 'update' && onEditLabel(label);
        type === 'remove' && onRemoveLabel(label);
    };

    return (
        <OrderableTableRow
            cells={[
                <div key="0" className="flex flex-nowrap">
                    <Icon
                        name={Exclusive ? 'folder' : 'label'}
                        style={{ fill: Color }}
                        className="icon-16p flex-item-noshrink mr1 mtauto mbauto"
                    />
                    <span className="ellipsis">{Name}</span>
                </div>,
                <div key="1" className="w10">
                    {Exclusive === 1 ? <ToggleNotify label={label} /> : ''}
                </div>,
                <ActionsLabel key="2" label={label} onChange={handleChange} />
            ]}
            {...rest}
        />
    );
}

LabelItem.propTypes = {
    label: PropTypes.object.isRequired,
    onEditLabel: PropTypes.func,
    onRemoveLabel: PropTypes.func,
    index: PropTypes.number.isRequired
};

export default LabelItem;
