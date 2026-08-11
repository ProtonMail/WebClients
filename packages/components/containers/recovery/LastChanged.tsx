import { format, isThisYear } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

const getLastChangedText = (formattedDate: string) => c('Status').t`Last changed ${formattedDate}`;

/**
 * date-fns has no localised date format without a year, so the day and month are ordered
 * after the locale's own format, e.g. "Aug 10" for en-US and "10 Aug" for en-GB. Falls back
 * to month first if the locale has no format to read the order from.
 */
const getFormatWithoutYear = () => {
    const localisedFormat = dateLocale.formatLong?.date({ width: 'medium' }) ?? '';
    const dayIndex = localisedFormat.indexOf('d');
    const monthIndex = localisedFormat.indexOf('M');
    const isDayFirst = dayIndex !== -1 && (monthIndex === -1 || dayIndex < monthIndex);
    return isDayFirst ? 'd MMM' : 'MMM d';
};

interface Props {
    date: Date | null | undefined;
    className?: string;
    'data-testid'?: string;
}

export const LastChanged = ({ date, className, 'data-testid': dataTestId }: Props) => {
    if (!date) {
        return null;
    }

    // `dateLocale` carries the user's date and time format settings, so both of these follow
    // their preferences. Dates in the current year drop the year, e.g. "Aug 10" over "Aug 10, 2026".
    const formattedDate = format(date, isThisYear(date) ? getFormatWithoutYear() : 'PP', { locale: dateLocale });
    // The tooltip always spells out the full date and time
    const formattedDateTime = format(date, 'PPp', { locale: dateLocale });

    return (
        <span
            className={clsx('text-sm color-weak', className)}
            data-testid={dataTestId}
            title={getLastChangedText(formattedDateTime)}
        >
            {getLastChangedText(formattedDate)}
        </span>
    );
};
