import React, { RefObject, useMemo } from 'react';
import { c, msgid } from 'ttag';

import { getIsCalendarDisabled } from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { restrictedCalendarSanitize } from '@proton/shared/lib/calendar/sanitize';
import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import urlify from '@proton/shared/lib/calendar/urlify';
import { canonizeEmailByGuess, canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { EventModelReadView, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    IconRow,
    Info,
    useMailSettings,
} from '@proton/components';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import CalendarSelectIcon from '@proton/components/components/calendarSelect/CalendarSelectIcon';

import { getOrganizerDisplayData } from '../../helpers/attendees';
import { DisplayNameEmail } from '../../containers/calendar/interface';
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
    extraText?: string;
};
type GroupedAttendees = {
    [key: string]: AttendeeViewModel[];
};
const { ACCEPTED, DECLINED, TENTATIVE, NEEDS_ACTION } = ICAL_ATTENDEE_STATUS;

interface Props {
    calendar: VisualCalendar;
    model: EventModelReadView;
    formatTime: (date: Date) => string;
    displayNameEmailMap: SimpleMap<DisplayNameEmail>;
    popoverEventContentRef: RefObject<HTMLDivElement>;
}
const PopoverEventContent = ({ calendar, model, formatTime, displayNameEmailMap, popoverEventContentRef }: Props) => {
    const [mailSettings] = useMailSettings();
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
    const sanitizedLocation = useMemo(
        () => restrictedCalendarSanitize(urlify(model.location.trim())),
        [model.location]
    );
    const htmlString = useMemo(() => {
        const description = urlify(model.description.trim());
        return restrictedCalendarSanitize(description);
    }, [model.description]);

    const calendarString = useMemo(() => {
        if (isCalendarDisabled) {
            const disabledText = <span className="text-italic">({c('Disabled calendar').t`Disabled`})</span>;
            const tooltipText = c('Disabled calendar tooltip').t`The event belongs to a disabled calendar.`;

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

    const { modal: linkModal } = useLinkHandler(popoverEventContentRef, mailSettings);

    const canonizedOrganizerEmail = canonizeEmailByGuess(organizer?.email || '');

    const attendeesWithoutOrganizer = model.attendees.filter(
        ({ email }) => canonizeEmailByGuess(email) !== canonizedOrganizerEmail
    );
    const groupedAttendees = attendeesWithoutOrganizer
        .map((attendee) => {
            const attendeeEmail = attendee.email;
            const selfEmail = model.selfAddress?.Email;
            const displayName =
                displayNameEmailMap[canonizeEmailByGuess(attendeeEmail)]?.displayName || attendee.cn || attendeeEmail;
            const isYou = !!(selfEmail && canonizeInternalEmail(selfEmail) === canonizeInternalEmail(attendeeEmail));
            const name = isYou ? c('Participant name').t`You` : displayName;
            const title = name === attendee.email || isYou ? attendeeEmail : `${name} <${attendeeEmail}>`;
            const initials = getInitials(displayName);
            const tooltip = getAttendanceTooltip({ partstat: attendee.partstat, name, isYou });
            const extraText = attendee.role === ICAL_ATTENDEE_ROLE.OPTIONAL ? c('Attendee role').t`Optional` : '';

            return {
                title,
                text: name,
                icon: <AttendeeStatusIcon partstat={attendee.partstat} />,
                partstat: attendee.partstat,
                initials,
                tooltip,
                extraText,
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
                [NEEDS_ACTION]: [],
                other: [],
            }
        );

    const getAttendees = () => {
        return (
            <>
                {[
                    ...groupedAttendees[ACCEPTED],
                    ...groupedAttendees[TENTATIVE],
                    ...groupedAttendees[DECLINED],
                    ...groupedAttendees[NEEDS_ACTION],
                    ...groupedAttendees.other,
                ].map(({ icon, text, title, initials, tooltip, extraText }) => (
                    <Participant
                        key={title}
                        title={title}
                        initials={initials}
                        icon={icon}
                        text={text}
                        tooltip={tooltip}
                        extraText={extraText}
                    />
                ))}
            </>
        );
    };

    const organizerPartstat =
        hasOrganizer &&
        model.attendees.find(({ email }) => canonizeEmailByGuess(email) === canonizedOrganizerEmail)?.partstat;
    const organizerPartstatIcon = organizerPartstat ? <AttendeeStatusIcon partstat={organizerPartstat} /> : null;

    const groupedReplies = {
        [ACCEPTED]: { count: groupedAttendees[ACCEPTED].length, text: c('Event reply').t`yes` },
        [TENTATIVE]: { count: groupedAttendees[TENTATIVE].length, text: c('Event reply').t`maybe` },
        [DECLINED]: { count: groupedAttendees[DECLINED].length, text: c('Event reply').t`no` },
        [NEEDS_ACTION]: {
            count:
                attendeesWithoutOrganizer.length -
                (groupedAttendees[ACCEPTED].length +
                    groupedAttendees[TENTATIVE].length +
                    groupedAttendees[DECLINED].length +
                    groupedAttendees.other.length),
            text: c('Event reply').t`pending`,
        },
    };

    // We don't really use the delegated status right now
    if (organizerPartstat && organizerPartstat !== ICAL_ATTENDEE_STATUS.DELEGATED) {
        groupedReplies[organizerPartstat].count += 1;
    }

    const labelClassName = 'inline-flex pt0-25';

    const eventDetailsContent = (
        <>
            {sanitizedLocation ? (
                <IconRow labelClassName={labelClassName} title={c('Label').t`Location`} icon="map-pin">
                    <span
                        className="text-hyphens scroll-if-needed"
                        dangerouslySetInnerHTML={{ __html: sanitizedLocation }}
                    />
                </IconRow>
            ) : null}
            {!!numberOfParticipants && (
                <IconRow labelClassName={labelClassName} icon="user" title={c('Label').t`Participants`}>
                    <div className="w100">
                        <Collapsible>
                            <CollapsibleHeader
                                suffix={
                                    <CollapsibleHeaderIconButton
                                        expandText={c('Participants expand button label').t`Expand participants list`}
                                        collapseText={c('Participants collapse button label')
                                            .t`Collapse participants list`}
                                    >
                                        <Icon name="chevron-down" />
                                    </CollapsibleHeaderIconButton>
                                }
                            >
                                <div className="attendee-count">
                                    {numberOfParticipants}{' '}
                                    {c('Label').ngettext(msgid`participant`, `participants`, numberOfParticipants)}
                                    <div className="color-weak text-sm m0">
                                        {Object.entries(groupedReplies)
                                            .filter(([, { count }]) => count)
                                            .map(([, { text, count }]) => `${count} ${text}`)
                                            .join(', ')}
                                    </div>
                                </div>
                            </CollapsibleHeader>
                            <CollapsibleContent>{getAttendees()}</CollapsibleContent>
                        </Collapsible>
                        <Participant
                            className="is-organizer"
                            title={organizerTitle}
                            initials={getInitials(organizerName)}
                            icon={organizerPartstatIcon}
                            text={organizerName}
                            tooltip={organizerTitle}
                            extraText={c('Label').t`Organizer`}
                        />
                    </div>
                </IconRow>
            )}
            {calendarString ? (
                <IconRow
                    labelClassName={labelClassName}
                    title={c('Label').t`Calendar`}
                    icon={<CalendarSelectIcon color={Color} />}
                >
                    {calendarString}
                </IconRow>
            ) : null}
            {model.notifications?.length ? (
                <IconRow labelClassName={labelClassName} title={c('Label').t`Notifications`} icon="bell">
                    <div className="flex flex-column">
                        {model.notifications.map((notification) => (
                            <PopoverNotification
                                key={notification.id}
                                notification={notification}
                                formatTime={formatTime}
                            />
                        ))}
                    </div>
                </IconRow>
            ) : null}
            {htmlString ? (
                <IconRow labelClassName={labelClassName} title={c('Label').t`Description`} icon="text-align-left">
                    <div
                        className="text-break mt0 mb0 text-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: htmlString }}
                    />
                </IconRow>
            ) : null}
            {linkModal}
        </>
    );

    return eventDetailsContent;
};

export default PopoverEventContent;
