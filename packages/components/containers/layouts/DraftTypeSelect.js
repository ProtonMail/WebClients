import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { DRAFT_TYPE } from 'proton-shared/lib/constants';
import { Select } from '../../components';

const { NORMAL, PLAIN_TEXT } = DRAFT_TYPE;

const DraftTypeSelect = ({ draftType, onChange, loading }) => {
    const options = [
        { text: c('Option').t`Normal`, value: NORMAL },
        { text: c('Option').t`Plain text`, value: PLAIN_TEXT },
    ];

    const handleChange = ({ target }) => onChange(target.value);

    return <Select value={draftType} options={options} disabled={loading} onChange={handleChange} />;
};

DraftTypeSelect.propTypes = {
    draftType: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export default DraftTypeSelect;
