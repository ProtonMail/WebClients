import { HTMLAttributes } from 'react';

import { Options, readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

const getValue = (value?: string | number | null) => {
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
    children?: string | number | null;
    sameDayFormat?: Options['sameDayFormat'];
    format?: Options['format'];
    options?: Options;
}

const Time = ({ children, sameDayFormat, format, options, ...rest }: Props) => {
    return (
        <time {...rest}>
            {readableTime(getValue(children), { locale: dateLocale, sameDayFormat, format, ...options })}
        </time>
    );
};

export default Time;
