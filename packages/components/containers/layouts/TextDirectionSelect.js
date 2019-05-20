import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Select } from 'react-components';
import { RIGHT_TO_LEFT } from 'proton-shared/lib/constants';

const { ON, OFF } = RIGHT_TO_LEFT;

const TextDirectionSelect = ({ rightToLeft, onChange, loading }) => {
    const options = [
        { text: c('Option').t`Left to Right`, value: OFF },
        { text: c('Option').t`Right to Left`, value: ON }
    ];

    const handleChange = ({ target }) => {
        onChange(target.value);
    };

    return <Select value={rightToLeft} options={options} disabled={loading} onChange={handleChange} />;
};

TextDirectionSelect.propTypes = {
    rightToLeft: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default TextDirectionSelect;
