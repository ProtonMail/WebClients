import type { TimeHTMLAttributes } from 'react';

import type { Options } from '@proton/shared/lib/helpers/time';
import { readableTime } from '@proton/shared/lib/helpers/time';
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

type OwnProps = {
    value?: string | number | null;
    sameDayFormat?: Options['sameDayFormat'];
    format?: Options['format'];
    options?: Options;
};

interface Props extends TimeHTMLAttributes<HTMLTimeElement>, OwnProps {
    children: OwnProps['value'];
}

export const getReadableTime = ({ format, value, sameDayFormat, options }: OwnProps) => {
    return readableTime(getValue(value), { locale: dateLocale, sameDayFormat, format, ...options });
};

const Time = ({ children, sameDayFormat, format, options, ...rest }: Props) => {
    return <time {...rest}>{getReadableTime({ value: children, sameDayFormat, format, options })}</time>;
};

export default Time;
