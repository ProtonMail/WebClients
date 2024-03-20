import { format, parseISO } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

interface Props extends React.HTMLAttributes<HTMLTimeElement> {
    value: string;
    format?: string;
}

const ReadableDate = ({ value, format: dateFormat = 'MMM d, yyyy', ...rest }: Props) => {
    const parsedDate = parseISO(value);
    const formattedDate = format(parsedDate, dateFormat, { locale: dateLocale });

    return <time {...rest}>{formattedDate}</time>;
};

export default ReadableDate;
