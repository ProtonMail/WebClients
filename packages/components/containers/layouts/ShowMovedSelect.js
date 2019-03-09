import React from 'react';
import { c } from 'ttag';
import { Select } from 'react-components';
import { updateShowMoved } from 'proton-shared/lib/api/mailSettings';

import useApi from '../../hooks/useApi';

const ShowMovedSelect = () => {
    const api = useApi();
    const handleChange = (event) => api(updateShowMoved(event.target.value));

    const options = [{ text: c('Option').t`Include Moved`, value: 3 }, { text: c('Option').t`Hide Moved`, value: 0 }];

    return <Select options={options} onChange={handleChange} />;
};

export default ShowMovedSelect;
