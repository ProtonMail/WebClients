import React, { useContext } from 'react';
import { c } from 'ttag';
import { Label, Radio } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { updateComposerMode } from 'proton-shared/lib/api/mailSettings';

const ComposerModeRadios = () => {
    const { api } = useContext(ContextApi);
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