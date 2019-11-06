import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LocalizedMiniCalendar, useApi } from 'react-components';
import { c } from 'ttag';
import { getYear } from 'date-fns';
import { getEventsOccurrences } from 'proton-shared/lib/api/calendars';

const EVERY_MINUTE = 60 * 1000;

const YearView = ({ calendarIDs = [], tzid: Timezone, currentDate, onSelectDate }) => {
    const api = useApi();
    const year = getYear(currentDate);
    const [occurrences, setOccurrences] = useState({});
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

    const fetchOccurrences = async () => {
        const result = await Promise.all(
            calendarIDs.map((calendarID) =>
                api(getEventsOccurrences(calendarID, year, { Timezone })).then(({ Occurrences = [] }) => Occurrences)
            )
        );
        setOccurrences(
            result
                .join()
                .split(',')
                .reduce((acc, dateString) => {
                    const [year, month, day] = dateString.split('-');
                    const date = new Date(+year, month - 1, +day);
                    acc[date.getTime()] = true;
                    return acc;
                }, {})
        );
    };

    useEffect(() => {
        fetchOccurrences();
        const intervalID = setInterval(fetchOccurrences, EVERY_MINUTE);

        return () => {
            clearInterval(intervalID);
        };
    }, [Timezone, year, calendarIDs]);

    return (
        <div className="flex flex-spacebetween">
            {months.map((month, index) => {
                const key = `${index}`;
                return (
                    <div className="w25 p1" key={key}>
                        <LocalizedMiniCalendar
                            date={month.date}
                            onSelectDate={onSelectDate}
                            markers={occurrences}
                            hasCursors={false}
                        />
                    </div>
                );
            })}
        </div>
    );
};

YearView.propTypes = {
    tzid: PropTypes.string.isRequired,
    calendarIDs: PropTypes.arrayOf(PropTypes.string),
    currentDate: PropTypes.instanceOf(Date),
    onSelectDate: PropTypes.func,
    schedules: PropTypes.array
};

export default YearView;
