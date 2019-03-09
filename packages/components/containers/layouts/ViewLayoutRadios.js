import React from 'react';
import { c } from 'ttag';
import { Label, Radio } from 'react-components';
import { updateViewLayout } from 'proton-shared/lib/api/mailSettings';

import useApi from '../../hooks/useApi';

const ViewLayoutRadios = () => {
    const api = useApi();
    const handleChange = (mode) => () => api(updateViewLayout(mode));

    return (
        <>
            <Label htmlFor="columnRadio">
                <Radio id="columnRadio" name="viewLayout" onChange={handleChange(0)} />
                {c('Label').t`Column`}
            </Label>
            <Label htmlFor="rowRadio">
                <Radio id="rowRadio" name="viewLayout" onChange={handleChange(1)} />
                {c('Label').t`Radio`}
            </Label>
        </>
    );
};

export default ViewLayoutRadios;
