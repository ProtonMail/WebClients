import { HTMLAttributes } from 'react';

import { readableTimeLegacy } from '@proton/shared/lib/helpers/time';
import { dateLocale } from '@proton/shared/lib/i18n';

type Options = Parameters<typeof readableTimeLegacy>[2];
interface Props extends HTMLAttributes<HTMLTimeElement> {
    children?: string | number | null;
    format?: string;
    forceFormat?: boolean;
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

const Time = ({ children, format = 'PP', options = { locale: dateLocale }, forceFormat = false, ...rest }: Props) => {
    return <time {...rest}>{readableTimeLegacy(getValue(children), format, options, forceFormat)}</time>;
};

export default Time;
