import React, { useMemo, useCallback } from 'react';
import { c } from 'ttag';
import { getFormattedMonths, getFormattedWeekdays, getWeekStartsOn } from 'proton-shared/lib/date/date';
import { dateLocale } from 'proton-shared/lib/i18n';
import { format } from 'date-fns';

import MiniCalendar, { Props as MiniCalProps } from './MiniCalendar';

export type Props = MiniCalProps;

const LocalizedMiniCalendar = (props: Props) => {
    const weekdaysLong = useMemo(() => {
        return getFormattedWeekdays('cccc', { locale: dateLocale });
    }, [dateLocale]);

    const weekdaysShort = useMemo(() => {
        return getFormattedWeekdays('ccccc', { locale: dateLocale });
    }, [dateLocale]);

    const months = useMemo(() => {
        return getFormattedMonths('MMMM', { locale: dateLocale });
    }, [dateLocale]);

    const formatDay = useCallback(
        (date) => {
            return format(date, 'PPPP', { locale: dateLocale });
        },
        [dateLocale]
    );

    return (
        <MiniCalendar
            nextMonth={c('Action').t`Next month`}
            prevMonth={c('Action').t`Prev month`}
            weekdaysLong={weekdaysLong}
            weekdaysShort={weekdaysShort}
            months={months}
            weekStartsOn={props.weekStartsOn || getWeekStartsOn(dateLocale)}
            formatDay={formatDay}
            {...props}
        />
    );
};

export default LocalizedMiniCalendar;
