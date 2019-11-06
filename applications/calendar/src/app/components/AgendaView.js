import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getKey, splitTimeGridEventsPerDay } from './calendar/splitTimeGridEventsPerDay';
import { formatWithLocale } from 'proton-shared/lib/i18n/dateFnHelper';

const AgendaView = ({ events, dateRange, currentDate, onSelectDate }) => {
    const splittedEvents = useMemo(() => {
        const result = splitTimeGridEventsPerDay({
            events: events,
            min: dateRange[0],
            max: dateRange[dateRange.length - 1],
            totalMinutes: 60 * 24
        });
        return Object.keys(result)
            .sort()
            .map((key) => {
                const [year, month, date] = key.split('-');
                return {
                    date: new Date(year, month, date),
                    eventsInDate: result[key] || []
                };
            });
    }, [events, dateRange]);

    return splittedEvents.map(({ date, eventsInDate }) => {
        const label = formatWithLocale(date, 'PPpp');
        return (
            <div key={getKey(date)} className="p1 flex flex-nowrap border-bottom">
                <div className="">
                    <button
                        role="link"
                        aria-label={label}
                        className="bold mr1"
                        type="button"
                        onClick={() => onSelectDate(date)}
                    >
                        {formatWithLocale(date, 'd')}
                    </button>
                    <span className="mr1">{formatWithLocale(date, 'MMM, EEE')}</span>
                </div>
                <div>
                    {eventsInDate.map(({ idx }) => {
                        const event = events[idx];
                        const { id, isAllDay, start, end } = event;
                        const key = `${id}-${idx}`;

                        const time = isAllDay
                            ? c('Label').t`All day`
                            : `${formatWithLocale(start, 'p')} - ${formatWithLocale(end, 'p')}`;

                        const title = `(${c('Label').t`No title`})`;

                        return (
                            <div key={key} className="mb0-5">
                                <span className="mr1">{time}</span>
                                <span>{title}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    });
};

AgendaView.propTypes = {
    currentDate: PropTypes.instanceOf(Date),
    onSelectDate: PropTypes.func,
    schedules: PropTypes.array
};

export default AgendaView;
