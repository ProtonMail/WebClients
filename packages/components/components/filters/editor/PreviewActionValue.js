import React from 'react';
import { Icon } from 'react-components';

function PreviewActionValue({ value, icon }) {
    if (!Array.isArray(value)) {
        return (
            <span className="Preview-action-value">
                <Icon name={icon} /> {value}
            </span>
        );
    }

    return value.map(({ Name, Color }, i) => {
        return (
            <span className="Preview-action-value" key={i.toString()}>
                <Icon name={icon} style={{ fill: Color }} /> {Name}
            </span>
        );
    });
}

export default PreviewActionValue;
