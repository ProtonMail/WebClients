import { HTMLAttributes } from 'react';

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

type Options = Parameters<typeof readableTime>[1];
interface Props extends HTMLAttributes<HTMLTimeElement> {
    children?: string | number | null;
    /**
     * If the current date in browser has the same date as the date to format then use this format.
     * @see {readableTime}
     */
    sameDayFormat?: string;
    /**
     * If the current date in browser differs from the date to format then use this format.
     * @see {readableTime}
     */
    format?: string;
    options?: Options;
}

const Time = ({ children, ...rest }: Props) => {
    const options: Options = { locale: dateLocale, ...rest };
    return <time {...rest}>{readableTime(getValue(children), options)}</time>;
};

export default Time;
