import React, { useMemo } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Icon, Info } from 'react-components';

import PopoverNotification from './PopoverNotification';
import CalendarIcon from '../calendar/CalendarIcon';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { getTimezonedFrequencyString } from '../../helpers/rrule';
import { truncate } from 'proton-shared/lib/helpers/string';

const PopoverEventContent = ({
    Calendar = {},
    isCalendarDisabled,
    event: { start, end, isAllDay, isAllPartDay } = {},
    tzid,
    weekStartsOn,
    model,
    formatTime
}) => {
    const { Name: calendarName, Color } = Calendar;

    const dateString = useMemo(() => {
        const dateStart = formatUTC(start, 'PP', { locale: dateLocale });
        const dateEnd = formatUTC(end, 'PP', { locale: dateLocale });

        if (dateStart === dateEnd) {
            return dateStart;
        }

        return `${dateStart} - ${dateEnd}`;
    }, [start, end]);

    const [weekdays] = useMemo(() => {
        return ['cccc'].map((format) => getFormattedWeekdays(format, { locale: dateLocale }));
    }, [dateLocale]);

    const timeString = useMemo(() => {
        const timeStart = formatTime(start);
        const timeEnd = formatTime(end);
        return `${timeStart} - ${timeEnd}`;
    }, [start, end]);

    const frequencyString = useMemo(() => {
        return getTimezonedFrequencyString(model.frequencyModel, {
            date: model.start.date,
            startTzid: model.start.tzid,
            currentTzid: tzid,
            weekdays,
            weekStartsOn,
            locale: dateLocale
        });
    }, [model.frequencyModel, weekdays, start]);

    const calendarString = useMemo(() => {
        if (isCalendarDisabled) {
            const truncatedCalendarName = truncate(calendarName, 32);
            const disabledText = <span className="italic">({c('Disabled calendar').t`Disabled`})</span>;
            const tooltipText = c('Disabled calendar')
                .t`The event belongs to a disabled calendar and you cannot modify it. Please enable your email address again to enable the calendar.`;
            return (
                <>
                    {truncatedCalendarName} {disabledText} <Info title={tooltipText} />
                </>
            );
        }
        return calendarName;
    }, [calendarName, isCalendarDisabled]);

    return (
        <>
            <div className="flex flex-nowrap mb0-5">
                <Icon name="clock" className="flex-item-noshrink mr1 mt0-25" />
                <div className="flex flex-column">
                    {!isAllDay || isAllPartDay ? <span>{timeString}</span> : null}
                    <span>{dateString}</span>
                </div>
            </div>
            {frequencyString ? (
                <div className="flex flex-nowrap mb0-5">
                    <Icon name="reload" className="flex-item-noshrink mr1 mt0-25" />
                    <span>{frequencyString}</span>
                </div>
            ) : null}
            {model.location ? (
                <div className="flex flex-items-center flex-nowrap mb0-5">
                    <Icon title={c('Title').t`Location`} name="address" className="flex-item-noshrink mr1" />
                    <span className="break">{model.location}</span>
                </div>
            ) : null}
            {calendarString ? (
                <div className="flex flex-items-center flex-nowrap mb0-5">
                    <CalendarIcon color={Color} className="flex-item-noshrink mr1" />
                    <span className="ellipsis" title={calendarName}>
                        {calendarString}
                    </span>
                </div>
            ) : null}
            {model.description ? (
                <div className="flex flex-nowrap mb0-5">
                    <Icon title={c('Title').t`Description`} name="note" className="flex-item-noshrink mr1 mt0-25" />
                    <p className="break mt0 mb0 pre-wrap">{model.description}</p>
                </div>
            ) : null}
            {model.notifications && Array.isArray(model.notifications) && model.notifications.length ? (
                <div className="flex flex-nowrap mb0-5">
                    <Icon name="notifications-enabled" className="flex-item-noshrink mr1 mt0-25" />
                    <div className="flex flex-column">
                        {model.notifications.map((notification, i) => {
                            return <PopoverNotification key={i} notification={notification} formatTime={formatTime} />;
                        })}
                    </div>
                </div>
            ) : null}
        </>
    );
};

PopoverEventContent.propTypes = {
    Calendar: PropTypes.object,
    isCalendarDisabled: PropTypes.bool,
    event: PropTypes.object,
    tzid: PropTypes.string,
    weekStartsOn: PropTypes.number,
    model: PropTypes.object,
    formatTime: PropTypes.func
};

export default PopoverEventContent;
