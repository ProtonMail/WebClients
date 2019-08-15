import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { c } from 'ttag';

import { WEEK_START } from '../constants';

const { MONDAY, SATURDAY, SUNDAY } = WEEK_START;

const WeekStartSelector = ({ day, onChangeDay, ...rest }) => {
    return (
        <Select
            options={[
                { text: c('Week day').t`Saturday`, value: SATURDAY },
                { text: c('Week day').t`Sunday`, value: SUNDAY },
                { text: c('Week day').t`Monday`, value: MONDAY }
            ]}
            value={day}
            onChange={({ target }) => onChangeDay(+target.value)}
            {...rest}
        />
    );
};

WeekStartSelector.propTypes = {
    day: PropTypes.number,
    onChangeDay: PropTypes.func
};

export default WeekStartSelector;
