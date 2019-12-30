import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon } from 'react-components';
import { format, differenceInWeeks } from 'date-fns';
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

const DateCursorButtons = ({ view, currentDate, now, dateRange, onToday, onPrev, onNext }) => {
    const currentRange = useMemo(() => {
        const formatOptions = { locale: dateLocale };
        if (view === WEEK || (view === MONTH && differenceInWeeks(dateRange[1], dateRange[0]) < 3)) {
            if (dateRange[0].getMonth() === dateRange[1].getMonth()) {
                const month = format(currentDate, 'MMM yyyy', formatOptions);
                const from = format(dateRange[0], 'd', formatOptions);
                const to = format(dateRange[1], 'd', formatOptions);
                return `${from} - ${to} ${month}`;
            }
            if (dateRange[0].getFullYear() === dateRange[1].getFullYear()) {
                const year = format(currentDate, 'yyyy', formatOptions);
                const from = format(dateRange[0], 'd MMM', formatOptions);
                const to = format(dateRange[1], 'd MMM', formatOptions);
                return `${from} - ${to} ${year}`;
            }
            const from = format(dateRange[0], 'd MMM yyyy', formatOptions);
            const to = format(dateRange[1], 'd MMM yyy', formatOptions);
            return `${from} - ${to}`;
        }
        return format(currentDate, FORMATS[view], formatOptions);
    }, [dateRange, view]);

    const today = useMemo(() => {
        return format(now, 'PP', { locale: dateLocale });
    }, []);

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
                className="toolbar-button color-currentColor flex-item-noshrink"
                title={today}
                onClick={onToday}
            >
                <Icon name="target" className="flex-item-noshrink mtauto mbauto toolbar-icon" />
                <span className="ml0-5 mtauto mbauto nomobile">{c('Action').t`Today`}</span>
            </button>
            <span className="toolbar-separator flex-item-noshrink" />
            <button type="button" className="toolbar-button flex-item-noshrink" title={previous} onClick={onPrev}>
                <Icon name="caret" className="mauto toolbar-icon rotateZ-90" />
                <span className="sr-only">{previous}</span>
            </button>
            <button type="button" className="toolbar-button flex-item-noshrink" title={next} onClick={onNext}>
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
    utcDate: PropTypes.instanceOf(Date),
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    onPrev: PropTypes.func,
    onNext: PropTypes.func,
    onToday: PropTypes.func,
    customRange: PropTypes.number,
    view: PropTypes.oneOf([DAY, WEEK, MONTH, YEAR, AGENDA])
};

export default DateCursorButtons;
