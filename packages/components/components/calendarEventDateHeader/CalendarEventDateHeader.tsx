import { format } from 'date-fns';
import formatUTC, { Options } from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';
import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { EnDash } from '../text';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    formatDate?: (date: Date) => string;
    formatTime?: (date: Date) => string;
    hasFakeUtcDates?: boolean;
    hasAllDayUtcDates?: boolean;
    formatOptions?: Options;
}
const CalendarEventDateHeader = ({
    startDate,
    endDate,
    isAllDay,
    formatDate: maybeFormatDate,
    formatTime: maybeFormatTime,
    hasFakeUtcDates = false,
    hasAllDayUtcDates = false,
    formatOptions: maybeFormatOptions,
    ...rest
}: Props) => {
    const useFormatUTC = hasFakeUtcDates || (isAllDay && hasAllDayUtcDates);
    const formatOptions = maybeFormatOptions || { locale: dateLocale };
    const formatDate = (date: Date) => {
        if (maybeFormatDate) {
            return maybeFormatDate(date);
        }
        if (useFormatUTC) {
            return formatUTC(date, 'ccc, PP', formatOptions);
        }
        return format(date, 'ccc, PP', formatOptions);
    };
    const formatTime = (date: Date) => {
        if (maybeFormatTime) {
            return maybeFormatTime(date);
        }
        if (useFormatUTC) {
            return formatUTC(date, 'p', formatOptions);
        }
        return format(date, 'p', formatOptions);
    };
    const [dateStart, dateEnd] = [startDate, endDate].map((date) => formatDate(date));
    const [timeStart, timeEnd] = [startDate, endDate].map((date) => formatTime(date));

    if (isAllDay) {
        if (dateStart === dateEnd) {
            return <div {...rest}>{dateStart}</div>;
        }
        return (
            <div {...rest}>
                {dateStart}
                <EnDash />
                {dateEnd}
            </div>
        );
    }
    if (dateStart === dateEnd) {
        return (
            <div {...rest}>
                {dateStart}
                {', '}
                <span className="inline-block">
                    {timeStart}
                    <EnDash />
                    {timeEnd}
                </span>
            </div>
        );
    }
    return (
        <div {...rest}>
            {dateStart} {timeStart}
            <EnDash />
            {dateEnd} {timeEnd}
        </div>
    );
};

export default CalendarEventDateHeader;
