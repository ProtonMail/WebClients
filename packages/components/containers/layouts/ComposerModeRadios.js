import React from 'react';
import { c } from 'ttag';
import { Label, Radio } from 'react-components';
import { updateComposerMode } from 'proton-shared/lib/api/mailSettings';
import useApi from '../../hooks/useApi';

const ComposerModeRadios = () => {
    const api = useApi();
    const handleChange = (mode) => () => api(updateComposerMode(mode));

    return (
        <>
            <Label htmlFor="popupRadio">
                <Radio id="popupRadio" name="composerMode" onChange={handleChange(0)} />
                {c('Label').t`Popup`}
            </Label>
            <Label htmlFor="maximizedRadio">
                <Radio id="maximizedRadio" name="composerMode" onChange={handleChange(1)} />
                {c('Label').t`Maximized`}
            </Label>
        </>
    );
};

export default ComposerModeRadios;
