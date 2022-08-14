import { useCallback, useMemo } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { getFormattedMonths, getFormattedWeekdays, getWeekStartsOn } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';

import MiniCalendar, { Props as MiniCalProps } from './MiniCalendar';

export type Props = MiniCalProps;

const LocalizedMiniCalendar = ({ weekStartsOn, now, todayTitle: todayTitleProp, ...rest }: Props) => {
    const weekdaysLong = useMemo(() => {
        return getFormattedWeekdays('cccc', { locale: dateLocale });
    }, [dateLocale]);

    const weekdaysShort = useMemo(() => {
        return getFormattedWeekdays('ccccc', { locale: dateLocale });
    }, [dateLocale]);

    const months = useMemo(() => {
        return getFormattedMonths('LLLL', { locale: dateLocale });
    }, [dateLocale]);

    const formatDay = useCallback(
        (date) => {
            return format(date, 'PPPP', { locale: dateLocale });
        },
        [dateLocale]
    );

    const todayTitle = useMemo(() => {
        if (todayTitleProp !== undefined) {
            return todayTitleProp;
        }

        if (!now) {
            return c('Today icon tooltip in mini calendar').t`Today`;
        }

        return format(now, 'PP', { locale: dateLocale });
    }, [now, dateLocale]);

    return (
        <MiniCalendar
            nextMonth={c('Action').t`Next month`}
            prevMonth={c('Action').t`Previous month`}
            weekdaysLong={weekdaysLong}
            weekdaysShort={weekdaysShort}
            months={months}
            weekStartsOn={weekStartsOn !== undefined ? weekStartsOn : getWeekStartsOn(dateLocale)}
            formatDay={formatDay}
            todayTitle={todayTitle}
            {...rest}
        />
    );
};

export default LocalizedMiniCalendar;
