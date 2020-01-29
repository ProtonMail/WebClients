import { c } from 'ttag';
import { Select } from 'react-components';
import React from 'react';
import PropTypes from 'prop-types';

import { FREQUENCY } from '../../../constants';

const { ONCE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM } = FREQUENCY;

const FrequencyInput = ({ value, onChange, ...rest }) => {
    const frequencies = [
        { text: c('Option').t`Do not repeat`, value: ONCE },
        { text: c('Option').t`Every day`, value: DAILY },
        { text: c('Option').t`Every week`, value: WEEKLY },
        { text: c('Option').t`Every month`, value: MONTHLY },
        { text: c('Option').t`Every year`, value: YEARLY },
        { text: c('Option').t`Custom`, value: CUSTOM }
    ];
    return <Select value={value} options={frequencies} onChange={({ target }) => onChange(target.value)} {...rest} />;
};

FrequencyInput.propTypes = {
    value: PropTypes.oneOf([ONCE, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM]).isRequired,
    onChange: PropTypes.func.isRequired
};

export default FrequencyInput;
