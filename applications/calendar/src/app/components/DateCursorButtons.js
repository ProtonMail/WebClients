import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon } from 'react-components';
import { format } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';

import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

const FORMATS = {
    [DAY]: 'PPP',
    [WEEK]: 'PPP',
    [MONTH]: 'MMMM yyyy',
    [YEAR]: 'yyyy',
    [AGENDA]: 'MMMM yyyy'
};

const DateCursorButtons = ({ view, currentDate, now, dateRange, onToday, onPrev, onNext }) => {
    const currentRange = useMemo(() => {
        if (view === WEEK) {
            const to = format(dateRange[1], FORMATS[view], { locale: dateLocale });
            if (dateRange[0].getMonth() === dateRange[1].getMonth()) {
                const from = format(dateRange[0], 'd', { locale: dateLocale });
                return `${from} - ${to}`;
            }
            const from = format(dateRange[0], FORMATS[view], { locale: dateLocale });
            return `${from} - ${to}`;
        }
        return format(currentDate, FORMATS[view], { locale: dateLocale });
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
            <button type="button" className="toolbar-button color-currentColor" title={today} onClick={onToday}>
                <Icon name="target" className="flex-item-noshrink mtauto mbauto toolbar-icon" />
                <span className="ml0-5 mtauto mbauto nomobile">{c('Action').t`Today`}</span>
            </button>
            <span className="toolbar-separator" />
            <button type="button" className="toolbar-button" title={previous} onClick={onPrev}>
                <Icon name="arrow-left" className="mauto toolbar-icon" />
                <span className="sr-only">{previous}</span>
            </button>
            <button type="button" className="toolbar-button" title={next} onClick={onNext}>
                <Icon name="arrow-right" className="mauto toolbar-icon" />
                <span className="sr-only">{next}</span>
            </button>
            <span className="toolbar-separator" />
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
