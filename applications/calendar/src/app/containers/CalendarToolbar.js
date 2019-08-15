import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon } from 'react-components';
import moment from 'moment';

import { VIEWS } from '../constants';
import ViewSelector from '../components/ViewSelector';
import TimezoneSelector from '../components/TimezoneSelector';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

const FORMATS = {
    [DAY]: 'MMMM GGGG',
    [WEEK]: 'MMMM GGGG',
    [MONTH]: 'MMMM GGGG',
    [YEAR]: 'GGGG',
    [AGENDA]: 'MMMM GGGG'
};

const CalendarToolbar = ({
    onToday,
    onPrev,
    onNext,
    view,
    onChangeView,
    currentDate,
    dateRange,
    timezone,
    onChangeTimezone
}) => {
    const previous = {
        day: c('Action').t`Previous day`,
        week: c('Action').t`Previous week`,
        month: c('Action').t`Previous month`,
        year: c('Action').t`Previous year`
    }[view];
    const today = moment().format('LL');
    const currentRange = moment(currentDate).format(FORMATS[view]);
    const next = {
        day: c('Action').t`Next day`,
        week: c('Action').t`Next week`,
        month: c('Action').t`Next month`,
        year: c('Action').t`Next year`
    }[view];

    return (
        <div className="toolbar noprint">
            <div className="flex flex-spacebetween">
                <div className="flex flex-items-center">
                    <button type="button" className="toolbar-button" title={today} onClick={onToday}>{c('Action')
                        .t`Today`}</button>
                    <span className="toolbar-separator ml0-5 mr0-5"></span>
                    <button type="button" className="toolbar-button" title={previous} onClick={onPrev}>
                        <Icon name="arrow-left" />
                    </button>
                    <span className="pl0-5 pr0-5">{currentRange}</span>
                    <button type="button" className="toolbar-button" title={next} onClick={onNext}>
                        <Icon name="arrow-right" />
                    </button>
                </div>
                <div>
                    {dateRange[0].toISOString()} - {dateRange[1].toISOString()}
                </div>
                <div className="flex flex-nowrap">
                    <TimezoneSelector className="" timezone={timezone} onChangeTimezone={onChangeTimezone} />
                    <ViewSelector view={view} onChangeView={onChangeView} />
                </div>
            </div>
        </div>
    );
};

CalendarToolbar.propTypes = {
    currentDate: PropTypes.instanceOf(Date),
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    onToday: PropTypes.func,
    onPrev: PropTypes.func,
    onNext: PropTypes.func,
    view: PropTypes.string,
    timezone: PropTypes.string,
    onChangeView: PropTypes.func,
    onChangeTimezone: PropTypes.func
};

export default CalendarToolbar;
