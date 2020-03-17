import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon } from 'react-components';
import { format } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';

import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

const FORMATS = {
    [DAY]: 'PP',
    [WEEK]: 'PP',
    [MONTH]: 'MMM yyyy',
    [YEAR]: 'yyyy',
    [AGENDA]: 'MMM yyyy'
};

const getDateRangeText = (view, range, currentDate, dateRange) => {
    const formatOptions = { locale: dateLocale };
    const [from, to] = dateRange;
    if (view === WEEK || range > 0) {
        if (from.getMonth() === to.getMonth()) {
            const fromString = format(from, 'd', formatOptions);
            const toString = format(to, 'd', formatOptions);
            const rest = format(from, 'MMM yyyy', formatOptions);
            return `${fromString} - ${toString} ${rest}`;
        }
        if (from.getFullYear() === to.getFullYear()) {
            const fromString = format(from, 'd MMM', formatOptions);
            const toString = format(to, 'd MMM', formatOptions);
            const rest = format(from, 'yyyy', formatOptions);
            return `${fromString} - ${toString} ${rest}`;
        }
        const fromString = format(from, 'd MMM yyyy', formatOptions);
        const toString = format(to, 'd MMM yyyy', formatOptions);
        return `${fromString} - ${toString}`;
    }
    return format(currentDate, FORMATS[view], formatOptions);
};

const DateCursorButtons = ({ view, range, currentDate, now, dateRange, onToday, onPrev, onNext }) => {
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
        [YEAR]: c('Action').t`Previous year`
    }[view];

    const next = {
        [DAY]: c('Action').t`Next day`,
        [WEEK]: c('Action').t`Next week`,
        [MONTH]: c('Action').t`Next month`,
        [YEAR]: c('Action').t`Next year`
    }[view];

    return (
        <>
            <button
                type="button"
                data-test-id="calendar-toolbar:today"
                className="toolbar-button color-currentColor flex-item-noshrink"
                title={todayTitle}
                onClick={onToday}
            >
                <Icon name="target" className="flex-item-noshrink mtauto mbauto toolbar-icon" />
                <span className="ml0-5 mtauto mbauto nomobile">{c('Action').t`Today`}</span>
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
            <span className="pl1 pr0-5 mtauto mbauto">{currentRange}</span>
        </>
    );
};

DateCursorButtons.propTypes = {
    now: PropTypes.instanceOf(Date),
    range: PropTypes.number,
    currentDate: PropTypes.instanceOf(Date),
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    onPrev: PropTypes.func,
    onNext: PropTypes.func,
    onToday: PropTypes.func,
    customRange: PropTypes.number,
    view: PropTypes.oneOf([DAY, WEEK, MONTH, YEAR, AGENDA])
};

export default DateCursorButtons;
