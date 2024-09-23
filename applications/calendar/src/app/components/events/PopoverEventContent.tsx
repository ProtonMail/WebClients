import type { ReactElement, RefObject } from 'react';
import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    IconRow,
    Info,
    useContactEmailsCache,
    useContactModals,
    useMailSettings,
} from '@proton/components';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { getIsCalendarDisabled, getIsSubscribedCalendar } from '@proton/shared/lib/calendar/calendar';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { escapeInvalidHtmlTags, restrictedCalendarSanitize } from '@proton/shared/lib/calendar/sanitize';
import urlify from '@proton/shared/lib/calendar/urlify';
import { APPS } from '@proton/shared/lib/constants';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { postMessageFromIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import {
    canonicalizeEmail,
    canonicalizeEmailByGuess,
    canonicalizeInternalEmail,
} from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { EventModelReadView, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import type { DisplayNameEmail } from '../../containers/calendar/interface';
import { getOrganizerDisplayData } from '../../helpers/attendees';
import AttendeeStatusIcon from './AttendeeStatusIcon';
import Participant from './Participant';
import PopoverNotification from './PopoverNotification';
import getAttendanceTooltip from './getAttendanceTooltip';

type AttendeeViewModel = {
    title: string;
    name: string;
    icon: ReactElement | null;
    partstat: ICAL_ATTENDEE_STATUS;
    initials: string;
    tooltip: string;
    extraText?: string;
    email: string;
    isCurrentUser?: boolean;
    /** If registered in contacts */
    contactID?: string;
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
    isDrawerApp: boolean;
}
const PopoverEventContent = ({
    calendar,
    model,
    formatTime,
    displayNameEmailMap,
    popoverEventContentRef,
    isDrawerApp,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const { Name: calendarName } = calendar;
    const { contactEmailsMap } = useContactEmailsCache();
    const { modals: contactModals, onDetails, onEdit } = useContactModals();

    const handleContactAdd = (email: string, name: string) => () => {
        const payload = {
            vCardContact: {
                fn: [{ field: 'fn', value: name, uid: createContactPropertyUid() }],
                email: [{ field: 'email', value: email, uid: createContactPropertyUid() }],
            },
        };

        if (isDrawerApp) {
            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.OPEN_CONTACT_MODAL,
                    payload,
                },
                APPS.PROTONMAIL
            );
        } else {
            onEdit(payload);
        }
    };
    const handleContactDetails = (contactID: string) => () => {
        if (isDrawerApp) {
            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.OPEN_CONTACT_MODAL,
                    payload: { contactID },
                },
                APPS.PROTONMAIL
            );
        } else {
            onDetails(contactID);
        }
    };

    const isCalendarDisabled = getIsCalendarDisabled(calendar);
    const isSubscribedCalendar = getIsSubscribedCalendar(calendar);
    const { organizer, attendees } = model;
    const hasOrganizer = !!organizer;
    const numberOfParticipants = attendees.length;
    const {
        name: organizerName,
        title: organizerTitle,
        contactID: organizerContactID,
    } = getOrganizerDisplayData(
        organizer,
        model.isOrganizer && !isSubscribedCalendar,
        contactEmailsMap,
        displayNameEmailMap
    );
    const sanitizedLocation = useMemo(() => {
        const urlified = urlify(model.location.trim());
        const escaped = escapeInvalidHtmlTags(urlified);
        return restrictedCalendarSanitize(escaped);
    }, [model.location]);
    const htmlString = useMemo(() => {
        const urlified = urlify(model.description.trim());
        const escaped = escapeInvalidHtmlTags(urlified);
        return restrictedCalendarSanitize(escaped);
    }, [model.description]);

    const calendarString = useMemo(() => {
        if (isCalendarDisabled) {
            const disabledText = <span className="text-italic">({c('Disabled calendar').t`Disabled`})</span>;
            const tooltipText = c('Disabled calendar tooltip').t`The event belongs to a disabled calendar.`;

            return (
                <>
                    <span className="text-break flex-auto grow-0 mr-2">{calendarName}</span>
                    <span className="text-no-wrap shrink-0">
                        {disabledText} <Info title={tooltipText} />
                    </span>
                </>
            );
        }

        return (
            <span className="text-break" title={calendarName}>
                {calendarName}
            </span>
        );
    }, [calendarName, isCalendarDisabled]);

    const { modal: linkModal } = useLinkHandler(popoverEventContentRef, mailSettings);

    const canonicalizedOrganizerEmail = canonicalizeEmailByGuess(organizer?.email || '');

    const attendeesWithoutOrganizer = model.attendees.filter(
        ({ email }) => canonicalizeEmailByGuess(email) !== canonicalizedOrganizerEmail
    );
    const groupedAttendees = attendeesWithoutOrganizer
        .map((attendee) => {
            const attendeeEmail = attendee.email;
            const selfEmail = model.selfAddress?.Email;
            const displayContact = displayNameEmailMap[canonicalizeEmailByGuess(attendeeEmail)];
            const displayName = displayContact?.displayName || attendee.cn || attendeeEmail;
            const isCurrentUser = !!(
                selfEmail && canonicalizeInternalEmail(selfEmail) === canonicalizeInternalEmail(attendeeEmail)
            );
            const name = isCurrentUser ? c('Participant name').t`You` : displayName;
            const title = name === attendee.email || isCurrentUser ? attendeeEmail : `${name} <${attendeeEmail}>`;
            const initials = getInitials(displayName);
            const tooltip = getAttendanceTooltip({ partstat: attendee.partstat, name, isYou: isCurrentUser });
            const extraText = attendee.role === ICAL_ATTENDEE_ROLE.OPTIONAL ? c('Attendee role').t`Optional` : '';
            const contactEmail = contactEmailsMap[canonicalizeEmail(attendeeEmail)];

            return {
                title,
                name,
                icon: <AttendeeStatusIcon partstat={attendee.partstat} />,
                partstat: attendee.partstat,
                initials,
                tooltip,
                extraText,
                email: attendeeEmail,
                isCurrentUser,
                contactID: contactEmail?.ContactID,
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
            <ul className="unstyled m-0">
                {[
                    ...groupedAttendees[ACCEPTED],
                    ...groupedAttendees[TENTATIVE],
                    ...groupedAttendees[DECLINED],
                    ...groupedAttendees[NEEDS_ACTION],
                    ...groupedAttendees.other,
                ].map(({ icon, name, title, initials, tooltip, extraText, email, contactID, isCurrentUser }) => (
                    <li className="pr-1" key={title}>
                        <Participant
                            title={title}
                            initials={initials}
                            icon={icon}
                            name={name}
                            tooltip={tooltip}
                            extraText={extraText}
                            email={email}
                            isContact={!!contactID}
                            isCurrentUser={isCurrentUser}
                            onCreateOrEditContact={
                                contactID ? handleContactDetails(contactID) : handleContactAdd(email, name)
                            }
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const organizerPartstat =
        hasOrganizer &&
        model.attendees.find(({ email }) => canonicalizeEmailByGuess(email) === canonicalizedOrganizerEmail)?.partstat;
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

    const labelClassName = 'inline-flex pt-1';

    const eventDetailsContent = (
        <>
            {sanitizedLocation ? (
                <IconRow labelClassName={labelClassName} title={c('Label').t`Location`} icon="map-pin">
                    <span className="text-break" dangerouslySetInnerHTML={{ __html: sanitizedLocation }} />
                </IconRow>
            ) : null}
            {!!numberOfParticipants && organizer && (
                <IconRow labelClassName={labelClassName} icon="user" title={c('Label').t`Participants`}>
                    <div className="w-full">
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
                                    <div className="color-weak text-sm m-0">
                                        {Object.entries(groupedReplies)
                                            .filter(([, { count }]) => count)
                                            .map(([, { text, count }]) => `${count} ${text}`)
                                            .join(', ')}
                                    </div>
                                </div>
                            </CollapsibleHeader>
                            <CollapsibleContent>{getAttendees()}</CollapsibleContent>
                        </Collapsible>
                        <div className="pr-1">
                            <Participant
                                className="is-organizer"
                                title={organizerTitle}
                                initials={getInitials(organizerName)}
                                icon={organizerPartstatIcon}
                                name={organizerName}
                                tooltip={organizerTitle}
                                extraText={c('Label').t`Organizer`}
                                email={organizer.email}
                                isContact={!!organizerContactID}
                                isCurrentUser={model.isOrganizer && !isSubscribedCalendar}
                                onCreateOrEditContact={
                                    organizerContactID
                                        ? handleContactDetails(organizerContactID)
                                        : handleContactAdd(organizer.email, organizerName)
                                }
                            />
                        </div>
                    </div>
                </IconRow>
            )}
            <IconRow
                className="flex-1"
                labelClassName="inline-flex pt-1"
                title={c('Label').t`Calendar`}
                icon="calendar-grid"
            >
                {calendarString}
            </IconRow>
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
                    <div className="text-break my-0 text-pre-wrap" dangerouslySetInnerHTML={{ __html: htmlString }} />
                </IconRow>
            ) : null}
            {linkModal}
            {contactModals}
        </>
    );

    return eventDetailsContent;
};

export default PopoverEventContent;
