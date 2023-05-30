import { HTMLAttributes } from 'react';

import { getUnixTime } from 'date-fns';

import { OptionsWithIntl, readableTimeIntl } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

const getValue = (value?: string | number | Date | null) => {
    if (value instanceof Date) {
        return getUnixTime(value);
    }

    if (typeof value === 'string') {
        const numberValue = parseInt(value, 10);
        if (!Number.isNaN(numberValue)) {
            return numberValue;
        }
    }

    if (typeof value === 'number') {
        return value;
    }

    return 0;
};

interface Props extends HTMLAttributes<HTMLTimeElement> {
    children?: string | number | Date | null;
    localeCode?: string;
    sameDayOptions?: OptionsWithIntl['sameDayIntlOptions'];
    options?: OptionsWithIntl['intlOptions'];
}

// Current dateLocale is based on date-fns and
// the only way to get TimeFormat for now is to check date-fns time format
// If an 'a' or 'b' is present in the format string it will be 12H TimeFormat
const is12HourDateFnsFormat = (formatString: string) => {
    const regex = /a|b/;
    return regex.test(formatString);
};

const TimeIntl = ({ children, sameDayOptions, options, ...rest }: Props) => {
    const time = getValue(children);
    const ISOTime = new Date(time * 1000).toISOString();
    return (
        <time dateTime={ISOTime} {...rest}>
            {readableTimeIntl(time, {
                localeCode: dateLocale.code,
                hour12: is12HourDateFnsFormat(dateLocale.formatLong?.time()),
                sameDayIntlOptions: sameDayOptions,
                intlOptions: options,
            })}
        </time>
    );
};

export default TimeIntl;
