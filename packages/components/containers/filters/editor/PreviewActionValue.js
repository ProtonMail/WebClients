import React from 'react';
import { Icon } from 'react-components';

function PreviewActionValue({ value, icon }) {
    if (!Array.isArray(value)) {
        return (
            <span className="Preview-action-value relative bg-global-highlight inline-flex flex-items-centered">
                <Icon name={icon} className="mauto" /> <span className="ml0-5">{value}</span>
            </span>
        );
    }

    return value.map(({ Name, Color }, i) => {
        return (
            <span
                className="Preview-action-value relative bg-global-highlight inline-flex flex-items-centered"
                key={i.toString()}
            >
                <Icon name={icon} color={Color} className="mauto" /> <span className="ml0-5">{Name}</span>
            </span>
        );
    });
}

export default PreviewActionValue;
