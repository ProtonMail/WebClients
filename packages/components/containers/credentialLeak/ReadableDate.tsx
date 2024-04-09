import { format, parseISO } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

interface Props {
    value: string;
    format?: string;
    displayInfoText?: boolean;
    dateInBold?: boolean;
    className?: string;
}

const ReadableDate = ({
    value,
    format: dateFormat = 'MMM d, yyyy',
    displayInfoText = false,
    dateInBold = false,
    className,
}: Props) => {
    const parsedDate = parseISO(value);
    const formattedDate = format(parsedDate, dateFormat, { locale: dateLocale });
    const timeDate = format(parsedDate, 'yyyy-MM-dd');

    const displayedDate = (
        <time dateTime={timeDate} className={clsx(dateInBold && 'text-semibold')}>
            {formattedDate}
        </time>
    );

    return (
        <div className={className}>
            {displayInfoText ? (
                // translator: full sentence is: Your information was found on <Apr 5, 2004>
                <span className="mr-1 color-weak">{c('Info').jt`Your information was found on ${displayedDate}`}</span>
            ) : (
                displayedDate
            )}
        </div>
    );
};

export default ReadableDate;
