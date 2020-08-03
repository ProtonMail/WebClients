import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import React, { useMemo, useState } from 'react';
import { c } from 'ttag';
import { Icon, Info, Tabs } from 'react-components';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Calendar as tsCalendar } from 'proton-shared/lib/interfaces/calendar';
import { getTimezonedFrequencyString } from 'proton-shared/lib/calendar/integration/getFrequencyString';

import { sanitizeDescription } from '../../helpers/sanitize';
import PopoverNotification from './PopoverNotification';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { EventModelReadView } from '../../interfaces/EventModel';
import { sortNotifications } from '../../containers/calendar/sortNotifications';

interface Props {
    Calendar: tsCalendar;
    isCalendarDisabled: boolean;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    tzid: string;
    weekStartsOn: WeekStartsOn;
    model: EventModelReadView;
    formatTime: (date: Date) => string;
}
const PopoverEventContent = ({
    Calendar,
    isCalendarDisabled,
    event: {
        data: { eventReadResult },
    },
    tzid,
    weekStartsOn,
    model,
    formatTime,
}: Props) => {
    const [tab, setTab] = useState(0);
    const { Name: calendarName, Color } = Calendar;

    const trimmedLocation = model.location.trim();
    const htmlString = useMemo(() => {
        return sanitizeDescription(model.description.trim());
    }, [model.description]);

    const frequencyString = useMemo(() => {
        const [eventComponent] = eventReadResult?.result || [];
        if (!eventComponent) {
            return;
        }
        return getTimezonedFrequencyString(eventComponent.rrule, eventComponent.dtstart, {
            currentTzid: tzid,
            weekStartsOn,
            locale: dateLocale,
        });
    }, [eventReadResult, tzid]);

    const calendarString = useMemo(() => {
        if (isCalendarDisabled) {
            const disabledText = <span className="italic">({c('Disabled calendar').t`Disabled`})</span>;
            const tooltipText = c('Disabled calendar')
                .t`The event belongs to a disabled calendar and you cannot modify it. Please enable your email address again to enable the calendar.`;
            return (
                <>
                    <span className="ellipsis flex-item-fluid-auto flex-item-nogrow mr0-5" title={calendarName}>
                        {calendarName}
                    </span>
                    <span className="no-wrap flex-item-noshrink">
                        {disabledText} <Info title={tooltipText} />
                    </span>
                </>
            );
        }
        return (
            <span className="ellipsis" title={calendarName}>
                {calendarName}
            </span>
        );
    }, [calendarName, isCalendarDisabled]);

    const wrapClassName = 'flex flex-nowrap mb0-75 ml0-25 mr0-25';
    const iconClassName = 'flex-item-noshrink mr1 mt0-25';

    const eventDetailsContent = (
        <>
            {frequencyString ? (
                <div className={wrapClassName}>
                    <Icon name="reload" className={iconClassName} />
                    <span>{frequencyString}</span>
                </div>
            ) : null}
            {trimmedLocation ? (
                <div className={wrapClassName}>
                    <Icon name="address" className={iconClassName} />
                    <span className="break">{trimmedLocation}</span>
                </div>
            ) : null}
            {calendarString ? (
                <div className={wrapClassName}>
                    <Icon name="circle" color={Color} className={iconClassName} />
                    {calendarString}
                </div>
            ) : null}
            {htmlString ? (
                <div className={wrapClassName}>
                    <Icon name="note" className={iconClassName} />
                    <div className="break mt0 mb0 pre-wrap" dangerouslySetInnerHTML={{ __html: htmlString }} />
                </div>
            ) : null}
            {Array.isArray(model.notifications) && model.notifications.length ? (
                <div className={wrapClassName}>
                    <Icon name="notifications-enabled" className={iconClassName} />
                    <div className="flex flex-column">
                        {sortNotifications(model.notifications).map((notification, i) => {
                            const key = `${i}`;
                            return (
                                <PopoverNotification key={key} notification={notification} formatTime={formatTime} />
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </>
    );

    return (
        <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
                {
                    title: c('Title').t`Event details`,
                    content: eventDetailsContent,
                },
            ]}
        />
    );
};

export default PopoverEventContent;
