import React from 'react';
import PropTypes from 'prop-types';
import { getDate, getMonth, getDay } from 'date-fns';
import { range } from 'proton-shared/lib/helpers/array';
import { setDay } from 'proton-shared/lib/helpers/date';
import { c } from 'ttag';

const AgendaView = ({ currentDate, onSelectDate }) => {
    const currentDay = getDate(currentDate);
    const days = [currentDate, ...range(0, 30).map((index) => setDay(currentDate, currentDay + index + 1))];
    const handleDate = (date) => () => onSelectDate(date);
    const months = {
        0: c('Month').t`January`,
        1: c('Month').t`February`,
        2: c('Month').t`March`,
        3: c('Month').t`April`,
        4: c('Month').t`May`,
        5: c('Month').t`June`,
        6: c('Month').t`July`,
        7: c('Month').t`August`,
        8: c('Month').t`September`,
        9: c('Month').t`October`,
        10: c('Month').t`November`,
        11: c('Month').t`December`
    };

    const weekDays = {
        0: c('Week day').t`Sunday`,
        1: c('Week day').t`Monday`,
        2: c('Week day').t`Tuesday`,
        3: c('Week day').t`Wednesday`,
        4: c('Week day').t`Thursday`,
        5: c('Week day').t`Friday`,
        6: c('Week day').t`Saturday`
    };

    return (
        <>
            {days.map((date, index) => {
                const key = `${index}`;
                const label = `${months[getMonth(date)]}, ${weekDays[getDay(date)]}`;
                return (
                    <div key={key} className="p1 flex flex-nowrap border-bottom">
                        <div className="flex flex-nowrap flex-items-center">
                            <button
                                role="link"
                                aria-label={label}
                                className="bold mr0-5"
                                type="button"
                                onClick={handleDate(date)}
                            >
                                {getDate(date)}
                            </button>
                            <span>{label}</span>
                        </div>
                        <div>
                            <div className="mb0-5"></div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

AgendaView.propTypes = {
    currentDate: PropTypes.instanceOf(Date),
    onSelectDate: PropTypes.func,
    schedules: PropTypes.array
};

export default AgendaView;
