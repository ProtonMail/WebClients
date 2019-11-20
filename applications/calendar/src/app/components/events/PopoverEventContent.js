import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Icon } from 'react-components';
import { c } from 'ttag';
import { FREQUENCY } from '../../constants';

import PopoverNotification from './PopoverNotification';
import CalendarIcon from '../calendar/CalendarIcon';

const getFrequencyString = (frequency, startDay) => {
    if (frequency === FREQUENCY.DAILY) {
        return c('Info').t`Daily`;
    }
    if (frequency === FREQUENCY.WEEKLY) {
        return c('Info').t`Weekly on ${startDay}`;
    }
    if (frequency === FREQUENCY.MONTHLY) {
        return c('Info').t`Monthly on ${startDay}`;
    }
    if (frequency === FREQUENCY.YEARLY) {
        return c('Info').t`Yearly on ${startDay}`;
    }
};

const PopoverEventContent = ({
    Calendar = {},
    event: { start, end, isAllDay, isAllPartDay } = {},
    model,
    formatTime
}) => {
    const { Name: calendarName, Color } = Calendar;

    const dateString = useMemo(() => {
        const dateStart = formatUTC(start, 'PPP', { locale: dateLocale });
        const dateEnd = formatUTC(end, 'PPP', { locale: dateLocale });

        if (dateStart === dateEnd) {
            return dateStart;
        }

        return `${dateStart} - ${dateEnd}`;
    }, [start, end]);

    const dayString = useMemo(() => {
        return formatUTC(start, 'cccc', { locale: dateLocale });
    }, [start]);

    const timeString = useMemo(() => {
        const timeStart = formatTime(start);
        const timeEnd = formatTime(end);
        return `${timeStart} - ${timeEnd}`;
    }, [start, end]);

    const frequencyString = useMemo(() => {
        return getFrequencyString(model.frequency, dayString);
    }, [model.frequency, dayString]);

    return (
        <>
            <div className="flex flex-nowrap mb0-5">
                <Icon name="clock" className="flex-item-noshrink mr1 mt0-25" />
                <div className="flex flex-column">
                    {!isAllDay || isAllPartDay ? <span>{timeString}</span> : null}
                    <span>{dateString}</span>
                    {frequencyString ? (
                        <span className="flex flex-items-center flex-nowrap">
                            <Icon name="reload" size={12} />
                            <span className="ml0-25 flex-item-fluid ellipsis">{frequencyString}</span>
                        </span>
                    ) : null}
                </div>
            </div>
            {model.location ? (
                <div className="flex flex-items-center flex-nowrap mb0-5">
                    <Icon title={c('Title').t`Location`} name="address" className="flex-item-noshrink mr1" />
                    <span className="break">{model.location}</span>
                </div>
            ) : null}
            {calendarName ? (
                <div className="flex flex-items-center flex-nowrap mb0-5">
                    <CalendarIcon color={Color} className="flex-item-noshrink mr1" />
                    <span className="ellipsis" title={calendarName}>
                        {calendarName}
                    </span>
                </div>
            ) : null}
            {model.description ? (
                <div className="flex flex-nowrap mb0-5">
                    <Icon title={c('Title').t`Description`} name="note" className="flex-item-noshrink mr1 mt0-25" />
                    <p className="break mt0 mb0">{model.description}</p>
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
    event: PropTypes.object,
    model: PropTypes.object,
    formatTime: PropTypes.func
};

export default PopoverEventContent;
