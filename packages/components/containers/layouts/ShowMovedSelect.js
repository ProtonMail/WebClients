import React, { useContext } from 'react';
import { c } from 'ttag';
import { Select } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { updateShowMoved } from 'proton-shared/lib/api/mailSettings';

const ShowMovedSelect = () => {
    const { api } = useContext(ContextApi);
    const handleChange = (event) => api(updateShowMoved(event.target.value));

    const options = [
        { text: c('Option').t`Include Moved`, value: 3 },
        { text: c('Option').t`Hide Moved`, value: 0 }
    ];

    return <Select options={options} onChange={handleChange} />;
};

export default ShowMovedSelect;