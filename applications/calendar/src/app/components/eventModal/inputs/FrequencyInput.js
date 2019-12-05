import { c } from 'ttag';
import { Select } from 'react-components';
import React from 'react';
import PropTypes from 'prop-types';

import { FREQUENCY } from '../../../constants';

const FrequencyInput = ({ value, onChange }) => {
    const frequencies = [
        { text: c('Option').t`Do not repeat`, value: FREQUENCY.ONCE },
        { text: c('Option').t`Every week`, value: FREQUENCY.WEEKLY },
        { text: c('Option').t`Every month`, value: FREQUENCY.MONTHLY },
        { text: c('Option').t`Every year`, value: FREQUENCY.YEARLY }
    ];
    return <Select value={value} options={frequencies} onChange={({ target }) => onChange(target.value)} />;
};

FrequencyInput.propTypes = {
    value: PropTypes.oneOf([FREQUENCY.ONCE, FREQUENCY.WEEKLY, FREQUENCY.MONTHLY, FREQUENCY.YEARLY]).isRequired,
    onChange: PropTypes.func.isRequired
};

export default FrequencyInput;
