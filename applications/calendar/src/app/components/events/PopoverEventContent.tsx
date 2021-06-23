import { filterEmailNotifications } from 'proton-shared/lib/calendar/alarms';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { getTimezonedFrequencyString } from 'proton-shared/lib/calendar/integration/getFrequencyString';
import { getIsSubscribedCalendar } from 'proton-shared/lib/calendar/subscribe/helpers';
import { WeekStartsOn } from 'proton-shared/lib/date-fns-utc/interface';
import { canonizeEmailByGuess, canonizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { getInitials } from 'proton-shared/lib/helpers/string';
import { dateLocale } from 'proton-shared/lib/i18n';
import { Calendar as tsCalendar, EventModelReadView } from 'proton-shared/lib/interfaces/calendar';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import React, { useMemo, useState } from 'react';
import { Icon, Info, Tabs, Tooltip } from 'react-components';
import { c, msgid } from 'ttag';

import { getOrganizerDisplayData } from '../../helpers/attendees';
import { sanitizeDescription } from '../../helpers/sanitize';
import {
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
    DisplayNameEmail,
} from '../../containers/calendar/interface';
import urlify from '../../helpers/urlify';
import AttendeeStatusIcon from './AttendeeStatusIcon';
import getAttendanceTooltip from './getAttendanceTooltip';
import Participant from './Participant';
import PopoverNotification from './PopoverNotification';

type AttendeeViewModel = {
    title: string;
    text: string;
    icon: JSX.Element | null;
    partstat: ICAL_ATTENDEE_STATUS;
    initials: string;
    tooltip: string;
};
type GroupedAttendees = {
    [key: string]: AttendeeViewModel[];
};
const { ACCEPTED, DECLINED, TENTATIVE } = ICAL_ATTENDEE_STATUS;

interface Props {
    calendar: tsCalendar;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    tzid: string;
    weekStartsOn: WeekStartsOn;
    model: EventModelReadView;
    formatTime: (date: Date) => string;
    displayNameEmailMap: SimpleMap<DisplayNameEmail>;
}
const PopoverEventContent = ({
    calendar,
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
    const { Name: calendarName, Color } = calendar;

    const isInvitation = !model.isOrganizer;
    const isCalendarDisabled = getIsCalendarDisabled(calendar);
    const isSubscribedCalendar = getIsSubscribedCalendar(calendar);
    const { organizer, attendees } = model;
    const hasOrganizer = !!organizer;
    const numberOfParticipants = attendees.length;
    const { name: organizerName, title: organizerTitle } = getOrganizerDisplayData(
        organizer,
        isInvitation || isSubscribedCalendar,
        displayNameEmailMap
    );
    const organizerString = c('Event info').t`Organized by:`;
    const trimmedLocation = useMemo(() => sanitizeDescription(urlify(model.location.trim())), [model.location]);
    const htmlString = useMemo(() => {
        const description = urlify(model.description.trim());
        return sanitizeDescription(description);
    }, [model.description]);
    const displayNotifications = filterEmailNotifications(model.notifications);

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
            const disabledText = <span className="text-italic">({c('Disabled calendar').t`Disabled`})</span>;
            const tooltipText = c('Disabled calendar')
                .t`The event belongs to a disabled calendar and you cannot modify it.`;
            return (
                <>
                    <span className="text-ellipsis flex-item-fluid-auto flex-item-nogrow mr0-5" title={calendarName}>
                        {calendarName}
                    </span>
                    <span className="text-no-wrap flex-item-noshrink">
                        {disabledText} <Info title={tooltipText} />
                    </span>
                </>
            );
        }
        return (
            <span className="text-ellipsis" title={calendarName}>
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
                    <span
                        className="text-hyphens scroll-if-needed"
                        dangerouslySetInnerHTML={{ __html: trimmedLocation }}
                    />
                </div>
            ) : null}
            {hasOrganizer && (isInvitation || numberOfParticipants) ? (
                <div className={wrapClassName}>
                    <Icon name="contact" className={iconClassName} />
                    <span className="mr0-5r">{organizerString}</span>
                    <Tooltip title={organizerTitle}>
                        <span className="max-w100 inline-block text-ellipsis flex-item-fluid">{organizerName}</span>
                    </Tooltip>
                </div>
            ) : null}
            {calendarString ? (
                <div className={wrapClassName}>
                    <Icon name="circle" color={Color} className={iconClassName} />
                    {calendarString}
                </div>
            ) : null}
            {displayNotifications?.length ? (
                <div className={wrapClassName}>
                    <Icon name="notifications-enabled" className={iconClassName} />
                    <div className="flex flex-column">
                        {displayNotifications.map((notification) => (
                            <PopoverNotification
                                key={notification.id}
                                notification={notification}
                                formatTime={formatTime}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
            {htmlString ? (
                <div className={wrapClassName}>
                    <Icon name="text-align-left" className={iconClassName} />
                    <div
                        className="text-break mt0 mb0 text-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: htmlString }}
                    />
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
                    displayNameEmailMap[canonizeEmailByGuess(attendeeEmail)]?.displayName ||
                    attendee.cn ||
                    attendeeEmail;
                const isYou = !!(
                    selfEmail && canonizeInternalEmail(selfEmail) === canonizeInternalEmail(attendeeEmail)
                );
                const name = isYou ? c('Participant name').t`You` : displayName;
                const title = name === attendee.email || isYou ? attendeeEmail : `${name} (${attendeeEmail})`;
                const initials = getInitials(displayName);
                const tooltip = getAttendanceTooltip({ partstat: attendee.partstat, name, isYou });

                return {
                    title,
                    text: name,
                    icon: <AttendeeStatusIcon partstat={attendee.partstat} />,
                    partstat: attendee.partstat,
                    initials,
                    tooltip,
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
                        ({ icon, text, title, initials, tooltip }) => (
                            <Participant
                                key={title}
                                title={title}
                                initials={initials}
                                icon={icon}
                                text={text}
                                tooltip={tooltip}
                            />
                        )
                    )}
                </>
            ),
        });
    }

    return <Tabs value={tab} onChange={setTab} tabs={tabs} stickyTabs />;
};

export default PopoverEventContent;
