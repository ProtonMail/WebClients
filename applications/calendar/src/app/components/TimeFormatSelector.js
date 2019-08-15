import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';

const TimeFormatSelector = ({ format, onChange }) => {
    return (
        <Select
            value={format}
            onChange={({ target }) => onChange(target.value)}
            options={[{ text: '1pm', value: '' }, { text: '13:00', value: '' }]}
        />
    );
};

TimeFormatSelector.propTypes = {
    format: PropTypes.oneOf([]),
    onChange: PropTypes.func
};

export default TimeFormatSelector;
