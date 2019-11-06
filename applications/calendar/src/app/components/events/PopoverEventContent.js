import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Icon } from 'react-components';
import { c } from 'ttag';

import PopoverNotification from './PopoverNotification';
import CalendarIcon from '../calendar/CalendarIcon';

const PopoverRow = ({ children }) => <div className="flex flex-items-center flex-nowrap mb0-5">{children}</div>;

PopoverRow.propTypes = { children: PropTypes.node.isRequired };

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
            <PopoverRow>
                <Icon name="clock" className="flex-item-noshrink mr1" />
                <div>
                    {model.isAllDay ? null : <span>{timeString}</span>}
                    <span>{dateString}</span>
                    {model.frequency ? <span></span> : null}
                </div>
            </PopoverRow>
            {model.location ? (
                <PopoverRow>
                    <Icon title={c('Title').t`Location`} name="address" className="flex-item-noshrink mr1" />
                    <span className="break">{model.location}</span>
                </PopoverRow>
            ) : null}
            {calendarName ? (
                <PopoverRow>
                    <CalendarIcon color={Color} className="mr1" />
                    <span className="break">{calendarName}</span>
                </PopoverRow>
            ) : null}
            {model.description ? (
                <PopoverRow>
                    <Icon title={c('Title').t`Description`} name="note" className="flex-item-noshrink mr1" />
                    <p className="break mt0 mb0">{model.description}</p>
                </PopoverRow>
            ) : null}
            {model.notifications && Array.isArray(model.notifications) && model.notifications.length ? (
                <PopoverRow>
                    <Icon name="notifications-enabled" className="flex-item-noshrink mr1" />
                    <div>
                        {model.notifications.map((notification, i) => {
                            return <PopoverNotification key={i} notification={notification} formatTime={formatTime} />;
                        })}
                    </div>
                </PopoverRow>
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
