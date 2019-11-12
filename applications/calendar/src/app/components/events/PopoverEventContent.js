import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Icon } from 'react-components';
import { c } from 'ttag';

import PopoverNotification from './PopoverNotification';
import CalendarIcon from '../calendar/CalendarIcon';

const PopoverEventContent = ({ targetCalendar = {}, targetEvent = {}, model, formatTime }) => {
    const { Name: calendarName, Color } = targetCalendar;

    const dateString = useMemo(() => {
        const dateStart = formatUTC(targetEvent.start, 'PPP', { locale: dateLocale });
        const dateEnd = formatUTC(targetEvent.end, 'PPP', { locale: dateLocale });

        if (dateStart === dateEnd) {
            return dateStart;
        }

        return `${dateStart} - ${dateEnd}`;
    }, [targetEvent.start, targetEvent.end]);

    const timeString = useMemo(() => {
        const timeStart = formatTime(targetEvent.start);
        const timeEnd = formatTime(targetEvent.end);
        return `${timeStart} - ${timeEnd}`;
    }, [targetEvent.start, targetEvent.end]);

    return (
        <>
            <div className="flex flex-nowrap mb0-5">
                <Icon name="clock" className="flex-item-noshrink mr1 mt0-25" />
                <div className="flex flex-column">
                    {model.isAllDay ? null : <span>{timeString}</span>}
                    <span>{dateString}</span>
                    {model.frequency ? <span></span> : null}
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
                    <CalendarIcon color={Color} className="mr1" />
                    <span className="break">{calendarName}</span>
                </div>
            ) : null}
            {model.description ? (
                <div className="flex flex-items-center flex-nowrap mb0-5">
                    <Icon title={c('Title').t`Description`} name="note" className="flex-item-noshrink mr1" />
                    <p className="break mt0 mb0">{model.description}</p>
                </div>
            ) : null}
            {model.notifications && Array.isArray(model.notifications) && model.notifications.length ? (
                <div className="flex flex-items-center flex-nowrap mb0-5">
                    <Icon name="notifications-enabled" className="flex-item-noshrink mr1" />
                    <div>
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
    targetCalendar: PropTypes.object,
    targetEvent: PropTypes.object,
    model: PropTypes.object,
    formatTime: PropTypes.func
};

export default PopoverEventContent;
