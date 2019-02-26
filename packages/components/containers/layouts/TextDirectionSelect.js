import React, { useContext } from 'react';
import { c } from 'ttag';
import { Select } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { updateRightToLeft } from 'proton-shared/lib/api/mailSettings';

const TextDirectionSelect = () => {
    const { api } = useContext(ContextApi);
    const handleChange = (event) => api(updateRightToLeft(event.target.value));

    const options = [
        { text: c('Option').t`Left to Right`, value: 0 },
        { text: c('Option').t`Right to Left`, value: 1 }
    ];

    return <Select options={options} onChange={handleChange} />;
};

export default TextDirectionSelect;