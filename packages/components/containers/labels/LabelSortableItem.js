import React from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { OrderableTableRow, Icon } from '../../components';

import ActionsLabel from './ActionsLabel';

function LabelItem({ label, onEditLabel = noop, onRemoveLabel = noop, ...rest }) {
    const { Name, Color } = label;

    const handleChange = (type, label) => {
        if (type === 'update') {
            onEditLabel(label);
        } else if (type === 'remove') {
            onRemoveLabel(label);
        }
    };

    return (
        <OrderableTableRow
            cells={[
                <div key="0" className="flex flex-nowrap">
                    <Icon
                        name="label"
                        style={{ fill: Color }}
                        className="icon-16p flex-item-noshrink mr1 mtauto mbauto"
                    />
                    <span className="text-ellipsis" title={Name} data-test-id="folders/labels:item-name">
                        {Name}
                    </span>
                </div>,
                <ActionsLabel key="2" label={label} onChange={handleChange} />,
            ]}
            {...rest}
        />
    );
}

LabelItem.propTypes = {
    label: PropTypes.object.isRequired,
    onEditLabel: PropTypes.func,
    onRemoveLabel: PropTypes.func,
    index: PropTypes.number.isRequired,
};

export default LabelItem;
