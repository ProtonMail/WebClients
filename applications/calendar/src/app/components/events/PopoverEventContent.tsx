import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { getTimezonedFrequencyString } from 'proton-shared/lib/calendar/integration/getFrequencyString';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Calendar as tsCalendar } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import React, { useMemo, useState } from 'react';
import { Icon, Info, Tabs, Tooltip } from 'react-components';
import { c, msgid } from 'ttag';
import { sanitizeDescription, buildMSTeamsLinks } from '../../helpers/sanitize';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { sortNotifications } from '../../containers/calendar/sortNotifications';
import { EventModelReadView } from '../../interfaces/EventModel';
import ParticipantStatusIcon from './ParticipantStatusIcon';
import PopoverNotification from './PopoverNotification';

type AttendeeViewModel = {
    title: string;
    text: string;
    icon: JSX.Element | null;
    partstat: ICAL_ATTENDEE_STATUS;
};
type GroupedAttendees = {
    [key: string]: AttendeeViewModel[];
};
const { ACCEPTED, DECLINED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

interface Props {
    Calendar: tsCalendar;
    isCalendarDisabled: boolean;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    tzid: string;
    weekStartsOn: WeekStartsOn;
    model: EventModelReadView;
    formatTime: (date: Date) => string;
    contactEmailMap: SimpleMap<ContactEmail>;
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
    contactEmailMap,
}: Props) => {
    const [tab, setTab] = useState(0);
    const { Name: calendarName, Color } = Calendar;
    const numberOfParticipants = model.attendees.length;

    const trimmedLocation = model.location.trim();
    const htmlString = useMemo(() => {
        const description = buildMSTeamsLinks(model.description.trim());
        return sanitizeDescription(description);
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
                    <Icon name="text-align-left" className={iconClassName} />
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

    const tabs = [
        {
            title: c('Title').t`Event details`,
            content: eventDetailsContent,
        },
    ];

    if (numberOfParticipants) {
        const attendees = model.attendees
            .map((attendee) => {
                const contact = attendee.email && contactEmailMap[attendee.email];
                const name = contact ? contact.Name : attendee.email;
                return {
                    title: contact ? `${contact.Name} <${contact.Email}>` : attendee.email,
                    text: name,
                    icon: <ParticipantStatusIcon name={name} partstat={attendee.partstat} />,
                    partstat: attendee.partstat,
                };
            })
            .reduce<GroupedAttendees>(
                (acc, item) => {
                    if (Object.prototype.hasOwnProperty.call(acc, item.partstat)) {
                        acc[item.partstat as keyof typeof acc].push(item);
                    } else {
                        acc.other.push(item);
                    }
                    return acc;
                },
                {
                    [ACCEPTED]: [],
                    [DECLINED]: [],
                    [TENTATIVE]: [],
                    other: [],
                }
            );
        tabs.push({
            title: c('Event form').ngettext(
                msgid`${numberOfParticipants} participant`,
                `${numberOfParticipants} participants`,
                numberOfParticipants
            ),
            content: (
                <>
                    {[...attendees[ACCEPTED], ...attendees[TENTATIVE], ...attendees[DECLINED], ...attendees.other].map(
                        ({ icon, text, title }) => (
                            <div className="mb0-25">
                                {icon}
                                <Tooltip title={title}>{text}</Tooltip>
                            </div>
                        )
                    )}
                </>
            ),
        });
    }

    return <Tabs value={tab} onChange={setTab} tabs={tabs} />;
};

export default PopoverEventContent;
