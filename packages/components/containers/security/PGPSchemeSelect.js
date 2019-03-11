import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { Select, useApiWithoutResult } from 'react-components';
import { updatePGPScheme } from 'proton-shared/lib/api/mailSettings';

const PGPSchemeSelect = ({ id, pgpScheme }) => {
    const [value, setValue] = useState(pgpScheme);
    const { request, loading } = useApiWithoutResult(updatePGPScheme);
    const options = [
        { value: PACKAGE_TYPE.SEND_PGP_MIME, text: 'PGP/MIME' },
        { value: PACKAGE_TYPE.SEND_PGP_INLINE, text: 'Inline PGP' }
    ];

    const handleChange = async ({ target }) => {
        await request(target.value);
        // TODO call event manager
        setValue(target.value);
    };

    return <Select id={id} value={value} options={options} disabled={loading} onChange={handleChange} />;
};

PGPSchemeSelect.propTypes = {
    id: PropTypes.string,
    pgpScheme: PropTypes.number.isRequired
};

export default PGPSchemeSelect;
