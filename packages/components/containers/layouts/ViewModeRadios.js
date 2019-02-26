import React, { useContext } from 'react';
import { c } from 'ttag';
import { Label, Radio } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { updateViewMode } from 'proton-shared/lib/api/mailSettings';

const ViewModeRadios = () => {
    const { api } = useContext(ContextApi);
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