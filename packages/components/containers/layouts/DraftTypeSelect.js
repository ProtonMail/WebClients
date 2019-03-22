import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Select } from 'react-components';

const DraftTypeSelect = ({ draftType, handleChange, loading }) => {
    const options = [
        { text: c('Option').t`Normal`, value: 'text/html' },
        { text: c('Option').t`Plain Text`, value: 'text/plain' }
    ];

    return <Select value={draftType} options={options} disabled={loading} onChange={handleChange} />;
};

DraftTypeSelect.propTypes = {
    draftType: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default DraftTypeSelect;
