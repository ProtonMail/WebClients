import React, { useState } from 'react';
import { Toggle, Icon } from 'react-components';
import { ToggleState } from 'react-components/components/toggle/Toggle';

import mdx from './Toggle.mdx';

export default {
    component: Toggle,
    title: 'Components / Toggle',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [state, setState] = useState(true);
    return <Toggle checked={state} onChange={() => setState(!state)} />;
};

export const WithIcon = () => {
    const [state, setState] = useState(true);
    const handleLabel = (key: ToggleState) => {
        const iconName = key === ToggleState.on ? 'key' : 'keys';
        return (
            <span className="pm-toggle-label-text">
                <Icon name={iconName} alt={key} className="pm-toggle-label-img" />
            </span>
        );
    };
    return <Toggle checked={state} onChange={() => setState(!state)} label={handleLabel} />;
};

export const Loading = () => {
    return <Toggle loading />;
};

export const Disabled = () => {
    return <Toggle checked disabled />;
};
