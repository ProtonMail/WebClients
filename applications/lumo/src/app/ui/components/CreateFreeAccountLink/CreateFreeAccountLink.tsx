import React from 'react';

import { c } from 'ttag';

import { SettingsLink } from '@proton/components';

const CreateFreeAccountLink = () => {
    return (
        <SettingsLink path="/signup" className="link inline-block">
            {c('collider_2025: Link').t`Create a free account`}
        </SettingsLink>
    );
};

export default CreateFreeAccountLink;
