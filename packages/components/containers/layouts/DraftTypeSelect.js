import React from 'react';
import { c } from 'ttag';
import { Select } from 'react-components';
import { updateDraftType } from 'proton-shared/lib/api/mailSettings';

import useApi from '../../hooks/useApi';

const DraftTypeSelect = () => {
    const api = useApi();
    const handleChange = (event) => api(updateDraftType(event.target.value));

    const options = [
        { text: c('Option').t`Normal`, value: 'text/html' },
        { text: c('Option').t`Plain Text`, value: 'text/plain' }
    ];

    return <Select options={options} onChange={handleChange} />;
};

export default DraftTypeSelect;
