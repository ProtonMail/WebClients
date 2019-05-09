import React from 'react';
import { range } from 'proton-shared/lib/helpers/array';
import { noop } from 'proton-shared/lib/helpers/function';
import PropTypes from 'prop-types';
import Select from './Select';

const HOUR = 60 * 60 * 1000;

const timeSelectOptions = range(0, 24).reduce((options, hour) => {
    const formattedHour = hour < 10 ? `0${hour}` : hour;
    const hours = hour * HOUR;
    return [
        ...options,
        { text: `${formattedHour}:00`, value: hours },
        { text: `${formattedHour}:30`, value: hours + HOUR / 2 }
    ];
}, []);

const TimeSelect = ({ onChange, value, ...rest }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return <Select {...rest} options={timeSelectOptions} value={value} onChange={handleChange} />;
};

TimeSelect.propTypes = {
    value: PropTypes.number,
    onChange: PropTypes.func
};

TimeSelect.defaultValues = {
    value: 0,
    onChange: noop
};

export default TimeSelect;
