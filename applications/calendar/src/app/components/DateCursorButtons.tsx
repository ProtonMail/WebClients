import React, { useMemo } from 'react';
import { c } from 'ttag';
import { Icon } from 'react-components';
import { format } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';

import { VIEWS } from 'proton-shared/lib/calendar/constants';
import getDateRangeText from './getDateRangeText';

const { DAY, WEEK, MONTH, YEAR, AGENDA, CUSTOM } = VIEWS;

interface Props {
    view: VIEWS;
    range: number;
    currentDate: Date;
    now: Date;
    dateRange: Date[];
    onToday: () => void;
    onPrev: () => void;
    onNext: () => void;
}
const DateCursorButtons = ({ view, range, currentDate, now, dateRange, onToday, onPrev, onNext }: Props) => {
    const currentRange = useMemo(() => {
        return getDateRangeText(view, range, currentDate, dateRange);
    }, [view, range, currentDate, currentDate, dateRange]);

    const todayTitle = useMemo(() => {
        return format(now, 'PP', { locale: dateLocale });
    }, [now, dateLocale]);

    const previous = {
        [DAY]: c('Action').t`Previous day`,
        [WEEK]: c('Action').t`Previous week`,
        [MONTH]: c('Action').t`Previous month`,
        [AGENDA]: c('Action').t`Previous month`,
        [CUSTOM]: c('Action').t`Previous month`,
        [YEAR]: c('Action').t`Previous year`,
    }[view];

    const next = {
        [DAY]: c('Action').t`Next day`,
        [WEEK]: c('Action').t`Next week`,
        [MONTH]: c('Action').t`Next month`,
        [AGENDA]: c('Action').t`Next month`,
        [CUSTOM]: c('Action').t`Next month`,
        [YEAR]: c('Action').t`Next year`,
    }[view];

    return (
        <>
            <button
                type="button"
                data-test-id="calendar-toolbar:today"
                className="toolbar-button color-inherit flex-item-noshrink"
                title={todayTitle}
                onClick={onToday}
            >
                <Icon name="calendar-today" className="flex-item-noshrink mtauto mbauto toolbar-icon" />
                <span className="ml0-5 mtauto mbauto no-mobile">{c('Action').t`Today`}</span>
            </button>
            <span className="toolbar-separator flex-item-noshrink" />
            <button
                type="button"
                data-test-id="calendar-toolbar:previous"
                className="toolbar-button flex-item-noshrink"
                title={previous}
                onClick={onPrev}
            >
                <Icon name="caret" className="mauto toolbar-icon rotateZ-90" />
                <span className="sr-only">{previous}</span>
            </button>
            <button
                type="button"
                data-test-id="calendar-toolbar:next"
                className="toolbar-button flex-item-noshrink"
                title={next}
                onClick={onNext}
            >
                <Icon name="caret" className="mauto toolbar-icon rotateZ-270" />
                <span className="sr-only">{next}</span>
            </button>
            <span className="toolbar-separator flex-item-noshrink" />
            <span className="pl1 pr0-5 mtauto mbauto flex-item-noshrink">{currentRange}</span>
        </>
    );
};

export default DateCursorButtons;
