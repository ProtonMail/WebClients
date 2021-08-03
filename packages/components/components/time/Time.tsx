import * as React from 'react';
import { readableTime } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

type Options = Parameters<typeof readableTime>[2];
interface Props extends React.HTMLAttributes<HTMLTimeElement> {
    children?: string | number | null;
    format?: string;
    options?: Options;
}

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

const Time = ({ children, format = 'PP', options = { locale: dateLocale }, ...rest }: Props) => {
    return <time {...rest}>{readableTime(getValue(children), format, options)}</time>;
};

export default Time;
