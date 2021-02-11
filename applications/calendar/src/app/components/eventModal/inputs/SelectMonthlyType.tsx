import { MONTHLY_TYPE } from 'proton-shared/lib/calendar/constants';
import React, { useMemo } from 'react';
import { SelectTwo, Option } from 'react-components';
import { capitalize } from 'proton-shared/lib/helpers/string';
import { getOnDayString } from 'proton-shared/lib/calendar/integration/getFrequencyString';
import { getNegativeSetpos, getPositiveSetpos } from 'proton-shared/lib/calendar/helper';
import { toUTCDate, fromLocalDate } from 'proton-shared/lib/date/timezone';

// Filter out strings since TS creates an inverse mapping
const MONTHLY_TYPE_VALUES = Object.values(MONTHLY_TYPE).filter((type): type is number => typeof type === 'number');

interface Props {
    id?: string;
    value: MONTHLY_TYPE;
    date: Date;
    className?: string;
    title?: string;
    onChange: (value: MONTHLY_TYPE) => void;
}

const SelectMonthlyType = ({ id, value, date, className, title, onChange }: Props) => {
    const options = useMemo(() => {
        const startFakeUtcDate = toUTCDate(fromLocalDate(date));

        const allOptions = MONTHLY_TYPE_VALUES.map((type) => {
            const onDayString = getOnDayString(startFakeUtcDate, type);
            return { text: capitalize(onDayString), value: type };
        });

        const isLastDay = getNegativeSetpos(startFakeUtcDate) === -1;
        const isFifthDay = getPositiveSetpos(startFakeUtcDate) === 5;

        return allOptions.filter(({ value }) => {
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
    }, [date]);

    return (
        <SelectTwo
            className={className}
            title={title}
            id={id}
            value={value}
            onChange={({ value }) => {
                const newValue = +value as MONTHLY_TYPE;
                onChange?.(newValue);
            }}
        >
            {options.map(({ text, value }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </SelectTwo>
    );
};

export default SelectMonthlyType;
