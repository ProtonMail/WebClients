import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon } from 'react-components';
import moment from 'moment';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

export const getDateDiff = (date, view, diff) => {
    switch (view) {
        case DAY:
            return addDays(date, diff);
        case WEEK:
            return addWeeks(date, diff);
        case MONTH:
            return addMonths(date, diff);
        case YEAR:
            return addYears(date, diff);
        case AGENDA:
            return addMonths(date, diff);
    }
};

const FORMATS = {
    [DAY]: 'MMMM GGGG',
    [WEEK]: 'MMMM GGGG',
    [MONTH]: 'MMMM GGGG',
    [YEAR]: 'GGGG',
    [AGENDA]: 'MMMM GGGG'
};

const DateCursorButtons = ({ view, currentDate, onDate }) => {
    const today = moment().format('LL');
    const currentRange = moment(currentDate).format(FORMATS[view]);

    const previous = {
        day: c('Action').t`Previous day`,
        week: c('Action').t`Previous week`,
        month: c('Action').t`Previous month`,
        year: c('Action').t`Previous year`
    }[view];

    const next = {
        day: c('Action').t`Next day`,
        week: c('Action').t`Next week`,
        month: c('Action').t`Next month`,
        year: c('Action').t`Next year`
    }[view];

    return (
        <>
            <button type="button" className="toolbar-button" title={today} onClick={() => onDate(new Date())}>{c(
                'Action'
            ).t`Today`}</button>
            <span className="toolbar-separator ml0-5 mr0-5"></span>
            <button
                type="button"
                className="toolbar-button"
                title={previous}
                onClick={() => onDate(getDateDiff(currentDate, view, -1))}
            >
                <Icon name="arrow-left" />
            </button>
            <span className="pl0-5 pr0-5">{currentRange}</span>
            <button
                type="button"
                className="toolbar-button"
                title={next}
                onClick={() => onDate(getDateDiff(currentDate, view, 1))}
            >
                <Icon name="arrow-right" />
            </button>
        </>
    );
};

DateCursorButtons.propTypes = {
    currentDate: PropTypes.instanceOf(Date),
    onDate: PropTypes.func,
    view: PropTypes.oneOf([DAY, WEEK, MONTH, YEAR, AGENDA])
};

export default DateCursorButtons;
