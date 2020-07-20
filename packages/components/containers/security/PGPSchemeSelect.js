import React from 'react';
import PropTypes from 'prop-types';
import { PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { Select } from 'react-components';

const PGPSchemeSelect = ({ pgpScheme, ...rest }) => {
    const options = [
        { value: PACKAGE_TYPE.SEND_PGP_MIME, text: 'PGP/MIME' },
        { value: PACKAGE_TYPE.SEND_PGP_INLINE, text: 'Inline PGP' },
    ];
    return <Select value={pgpScheme} options={options} {...rest} />;
};

PGPSchemeSelect.propTypes = {
    pgpScheme: PropTypes.number.isRequired,
};

export default PGPSchemeSelect;
