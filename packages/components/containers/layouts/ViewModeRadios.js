import React from 'react';
import { c } from 'ttag';
import { Label, Radio } from 'react-components';
import { updateViewMode } from 'proton-shared/lib/api/mailSettings';

import useApi from '../../hooks/useApi';

const ViewModeRadios = () => {
    const api = useApi();
    const handleChange = (mode) => () => api(updateViewMode(mode));

    return (
        <>
            <Label htmlFor="conversationRadio">
                <Radio id="conversationRadio" name="viewMode" onChange={handleChange(0)} />
                {c('Label').t`Conversation Group`}
            </Label>
            <Label htmlFor="messageRadio">
                <Radio id="messageRadio" name="viewMode" onChange={handleChange(1)} />
                {c('Label').t`Single Messages`}
            </Label>
        </>
    );
};

export default ViewModeRadios;
