import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { format } from 'date-fns';

import EnDash from '@proton/components/components/text/EnDash';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import type { Options } from '@proton/shared/lib/date-fns-utc/format';
import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    formatDate?: (date: Date) => string;
    formatTime?: (date: Date) => string;
    hasFakeUtcDates?: boolean;
    hasModifiedAllDayEndDate?: boolean;
    formatOptions?: Options;
}
const CalendarEventDateHeader = ({
    startDate,
    endDate,
    isAllDay,
    formatDate: maybeFormatDate,
    formatTime: maybeFormatTime,
    hasFakeUtcDates = false,
    hasModifiedAllDayEndDate = false,
    formatOptions: maybeFormatOptions,
    ...rest
}: Props) => {
    const formatOptions = maybeFormatOptions || { locale: dateLocale };
    const formatDate = (date: Date) => {
        if (maybeFormatDate) {
            return maybeFormatDate(date);
        }
        if (hasFakeUtcDates) {
            return formatUTC(date, 'ccc, PP', formatOptions);
        }
        return format(date, 'ccc, PP', formatOptions);
    };
    const formatTime = (date: Date) => {
        if (maybeFormatTime) {
            return maybeFormatTime(date);
        }
        if (hasFakeUtcDates) {
            return formatUTC(date, 'p', formatOptions);
        }
        return format(date, 'p', formatOptions);
    };
    const formatForVocalization = (date: Date) => {
        return format(date, 'yyyy-MM-dd');
    };

    const dateStart = formatDate(startDate);
    const dateEnd = formatDate(isAllDay && !hasModifiedAllDayEndDate ? addDays(endDate, -1) : endDate);

    const dateStartVoc = formatForVocalization(startDate);
    const dateEndVoc = formatForVocalization(endDate);

    if (isAllDay) {
        if (dateStart === dateEnd) {
            return (
                <div {...rest}>
                    <time dateTime={dateStartVoc}>{dateStart}</time>
                </div>
            );
        }
        return (
            <div {...rest}>
                <time dateTime={dateStartVoc}>{dateStart}</time>
                <EnDash />
                <time dateTime={dateEndVoc}>{dateEnd}</time>
            </div>
        );
    }

    const [timeStart, timeEnd] = [startDate, endDate].map((date) => formatTime(date));

    if (dateStart === dateEnd) {
        return (
            <div data-testid="calendar-event-header:time-same-day" {...rest}>
                <time dateTime={dateStartVoc}>{dateStart}</time>
                {', '}
                <span className="inline-block">
                    <time dateTime={timeStart}>{timeStart}</time>
                    <EnDash />
                    <time dateTime={timeEnd}>{timeEnd}</time>
                </span>
            </div>
        );
    }
    return (
        <div data-testid="calendar-event-header:time" {...rest}>
            <time dateTime={dateStartVoc}>{dateStart}</time> <time dateTime={timeStart}>{timeStart}</time>
            <EnDash />
            <time dateTime={dateEndVoc}>{dateEnd}</time> <time dateTime={timeEnd}>{timeEnd}</time>
        </div>
    );
};

export default CalendarEventDateHeader;
