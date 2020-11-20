import React from 'react';
import { dateLocale } from 'proton-shared/lib/i18n';

import { fromUnixTime, format as formatDate } from 'date-fns';

interface Props extends React.HTMLAttributes<HTMLTimeElement> {
    value: number;
    format?: string;
}

const DateTime = ({ value, format = 'PPp', ...rest }: Props) => {
    return <time {...rest}>{formatDate(fromUnixTime(value), format, { locale: dateLocale })}</time>;
};

export default DateTime;
