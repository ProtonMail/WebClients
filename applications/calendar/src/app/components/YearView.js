import React from 'react';
import PropTypes from 'prop-types';
import {} from 'react-components';
import { c } from 'ttag';
import { getYear } from 'date-fns';

import MiniCalendar from './miniCalendar/MiniCalendar';

const YearView = ({ currentDate, onSelectDate }) => {
    const year = getYear(currentDate);
    const months = [
        { title: c('Month').t`January`, date: new Date(year, 0, 1) },
        { title: c('Month').t`February`, date: new Date(year, 1, 1) },
        { title: c('Month').t`March`, date: new Date(year, 2, 1) },
        { title: c('Month').t`April`, date: new Date(year, 3, 1) },
        { title: c('Month').t`May`, date: new Date(year, 4, 1) },
        { title: c('Month').t`June`, date: new Date(year, 5, 1) },
        { title: c('Month').t`July`, date: new Date(year, 6, 1) },
        { title: c('Month').t`August`, date: new Date(year, 7, 1) },
        { title: c('Month').t`September`, date: new Date(year, 8, 1) },
        { title: c('Month').t`October`, date: new Date(year, 9, 1) },
        { title: c('Month').t`November`, date: new Date(year, 10, 1) },
        { title: c('Month').t`December`, date: new Date(year, 11, 1) }
    ];
    return (
        <div className="flex flex-spacebetween">
            {months.map((month, index) => {
                const key = `${index}`;
                return (
                    <div className="w25 p1" key={key}>
                        <MiniCalendar date={month.date} onSelectDate={onSelectDate} />
                    </div>
                );
            })}
        </div>
    );
};

YearView.propTypes = {
    currentDate: PropTypes.instanceOf(Date),
    onSelectDate: PropTypes.func,
    schedules: PropTypes.array
};

export default YearView;
