import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';
import { capitalize } from 'proton-shared/lib/helpers/string';
import { getOnDayString, getPositiveSetpos, getNegativeSetpos } from '../../../helpers/rrule';
import { MONTHLY_TYPE } from '../../../constants';

const SelectMonthlyType = ({ id, value, date, onChange }) => {
    const weekdays = useMemo(() => {
        return getFormattedWeekdays('cccc', { locale: dateLocale, weekStartsOn: 0 });
    }, [dateLocale]);
    const allOptions = useMemo(() => {
        return Object.values(MONTHLY_TYPE).map((type) => {
            const onDayString = getOnDayString(date, type, weekdays);
            return { text: capitalize(onDayString), value: type };
        });
    }, [date, weekdays]);

    const isLastDay = getNegativeSetpos(date) === -1;
    const isFifthDay = getPositiveSetpos(date) === 5;
    const options = allOptions.filter(({ value }) => {
        if (value === MONTHLY_TYPE.ON_NTH_DAY && isFifthDay) {
            // we don't offer "on the fifth day" possibility
            return false;
        }
        if (value === MONTHLY_TYPE.ON_MINUS_NTH_DAY && !isLastDay) {
            // only display "last day" option when we are in the last day of the month
            return false;
        }
        return true;
    });

    return <Select id={id} value={value} options={options} onChange={onChange} />;
};

SelectMonthlyType.propTypes = {
    id: PropTypes.string,
    value: PropTypes.number,
    date: PropTypes.instanceOf(Date),
    onChange: PropTypes.func
};

export default SelectMonthlyType;
