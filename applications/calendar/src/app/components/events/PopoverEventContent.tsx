import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { getTimezonedFrequencyString } from 'proton-shared/lib/calendar/integration/getFrequencyString';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import { normalizeEmail, normalizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Calendar as tsCalendar } from 'proton-shared/lib/interfaces/calendar';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import React, { useMemo, useState } from 'react';
import { Icon, Info, Tabs, Tooltip } from 'react-components';
import { c, msgid } from 'ttag';
import { getOrganizerDisplayData } from '../../helpers/attendees';
import { sanitizeDescription, buildMSTeamsLinks } from '../../helpers/sanitize';
import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    DisplayNameEmail,
} from '../../containers/calendar/interface';
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
    displayNameEmailMap: SimpleMap<DisplayNameEmail>;
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
    displayNameEmailMap,
}: Props) => {
    const [tab, setTab] = useState(0);
    const { Name: calendarName, Color } = Calendar;

    const isInvitation = !model.isOrganizer;
    const { organizer, attendees } = model;
    const hasOrganizer = !!organizer;
    const numberOfParticipants = attendees.length;
    const { name: organizerName, title: organizerTitle } = getOrganizerDisplayData(
        organizer,
        isInvitation,
        displayNameEmailMap
    );
    const organizerString = c('Event info').t`Organized by:`;
    const trimmedLocation = model.location.trim();
    const htmlString = useMemo(() => {
        const description = buildMSTeamsLinks(model.description.trim());
        return sanitizeDescription(description);
    }, [model.description]);

    const frequencyString = useMemo(() => {
        const [{ veventComponent: eventComponent }] = eventReadResult?.result || [{}];
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
                    <span className="hyphens scroll-if-needed">{trimmedLocation}</span>
                </div>
            ) : null}
            {hasOrganizer && (isInvitation || numberOfParticipants) ? (
                <div className={wrapClassName}>
                    <Icon name="contact" className={iconClassName} />
                    <span className="mr0-5r">{organizerString}</span>
                    <span className="flex-item-fluid">
                        <Tooltip className="mw100 inbl ellipsis" title={organizerTitle}>
                            {organizerName}
                        </Tooltip>
                    </span>
                </div>
            ) : null}
            {calendarString ? (
                <div className={wrapClassName}>
                    <Icon name="circle" color={Color} className={iconClassName} />
                    {calendarString}
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
            {htmlString ? (
                <div className={wrapClassName}>
                    <Icon name="text-align-left" className={iconClassName} />
                    <div className="break mt0 mb0 pre-wrap" dangerouslySetInnerHTML={{ __html: htmlString }} />
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
                const attendeeEmail = attendee.email;
                const selfEmail = model.selfAddress?.Email;
                const displayName =
                    displayNameEmailMap[normalizeEmail(attendeeEmail)]?.displayName || attendee.cn || attendeeEmail;
                const isYou = selfEmail && normalizeInternalEmail(selfEmail) === normalizeInternalEmail(attendeeEmail);
                const name = isYou ? c('Participant name').t`You` : displayName;
                const title = name === attendee.email || isYou ? attendeeEmail : `${name} (${attendeeEmail})`;
                return {
                    title,
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
                            <div className="mb0-25 flex flex-nowrap">
                                <span className="flex-item-noshrink">{icon}</span>
                                <span className="flex-item-fluid">
                                    <Tooltip className="mw100 inbl ellipsis" title={title}>
                                        {text}
                                    </Tooltip>
                                </span>
                            </div>
                        )
                    )}
                </>
            ),
        });
    }

    return <Tabs value={tab} onChange={setTab} tabs={tabs} stickyTabs />;
};

export default PopoverEventContent;
