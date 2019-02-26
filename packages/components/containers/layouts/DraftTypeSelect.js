import React, { useContext } from 'react';
import { c } from 'ttag';
import { Select } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { updateDraftType } from 'proton-shared/lib/api/mailSettings';

const DraftTypeSelect = () => {
    const { api } = useContext(ContextApi);
    const handleChange = (event) => api(updateDraftType(event.target.value));

    const options = [
        { text: c('Option').t`Normal`, value: 'text/html' },
        { text: c('Option').t`Plain Text`, value: 'text/plain' }
    ];

    return <Select options={options} onChange={handleChange} />;
};

export default DraftTypeSelect;