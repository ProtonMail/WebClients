import * as React from 'react';

import { format as formatDate, fromUnixTime } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

interface Props extends React.HTMLAttributes<HTMLTimeElement> {
    value: number;
    format?: string;
}

const DateTimeLEGACY = ({ value, format = 'PPp', ...rest }: Props) => {
    return <time {...rest}>{formatDate(fromUnixTime(value), format, { locale: dateLocale })}</time>;
};

export default DateTimeLEGACY;
