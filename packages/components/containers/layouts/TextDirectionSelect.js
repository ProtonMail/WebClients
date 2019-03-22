import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Select } from 'react-components';

const TextDirectionSelect = ({ rightToLeft, onChange, loading }) => {
    const options = [
        { text: c('Option').t`Left to Right`, value: 0 },
        { text: c('Option').t`Right to Left`, value: 1 }
    ];

    return (
        <Select
            value={rightToLeft}
            options={options}
            disabled={loading}
            onChange={({ target }) => onChange(target.value)}
        />
    );
};

TextDirectionSelect.propTypes = {
    rightToLeft: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default TextDirectionSelect;
