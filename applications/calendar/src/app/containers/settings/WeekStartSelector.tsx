import React, { ChangeEvent } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { c } from 'ttag';
import { SETTINGS_WEEK_START } from 'proton-shared/lib/interfaces/calendar';

const { MONDAY, SUNDAY } = SETTINGS_WEEK_START;

interface Props {
    id?: string;
    loading?: boolean;
    day: SETTINGS_WEEK_START;
    onChangeDay: (day: SETTINGS_WEEK_START) => void;
}
const WeekStartSelector = ({ day, onChangeDay, ...rest }: Props) => {
    return (
        <Select
            options={[
                { text: c('Week day').t`Sunday`, value: SUNDAY },
                { text: c('Week day').t`Monday`, value: MONDAY }
            ]}
            value={day}
            onChange={({ target }: ChangeEvent<HTMLSelectElement>) => onChangeDay(+target.value)}
            {...rest}
        />
    );
};

WeekStartSelector.propTypes = {
    day: PropTypes.number,
    onChangeDay: PropTypes.func
};

export default WeekStartSelector;
