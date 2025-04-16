import { c } from 'ttag';

import { getIsAddressExternal } from '@proton/shared/lib/helpers/address';
import { unescape } from '@proton/shared/lib/sanitize/escape';
import isTruthy from '@proton/utils/isTruthy';
import unary from '@proton/utils/unary';

import { MIME_TYPES } from '../../constants';
import { addDays, format as formatUTC } from '../../date-fns-utc';
import type { Options } from '../../date-fns-utc/format';
import { formatTimezoneOffset, getTimezoneOffset, toUTCDate } from '../../date/timezone';
import {
    buildMailTo,
    canonicalizeEmail,
    canonicalizeEmailByGuess,
    canonicalizeInternalEmail,
} from '../../helpers/email';
import { omit, pick } from '../../helpers/object';
import { getCurrentUnixTimestamp } from '../../helpers/time';
import { dateLocale } from '../../i18n';
import type { Address } from '../../interfaces';
import type {
    Attendee,
    CalendarEvent,
    CalendarSettings,
    Participant,
    VcalAttendeeProperty,
    VcalComponentKeys,
    VcalOrganizerProperty,
    VcalStringProperty,
    VcalValarmComponent,
    VcalVcalendar,
    VcalVeventComponent,
    VcalVtimezoneComponent,
} from '../../interfaces/calendar';
import type { ContactEmail } from '../../interfaces/contacts';
import type { GetVTimezonesMap } from '../../interfaces/hooks/GetVTimezonesMap';
import type { RequireSome } from '../../interfaces/utils';
import { getSupportedPlusAlias } from '../../mail/addresses';
import { MESSAGE_FLAGS } from '../../mail/constants';
import { RE_PREFIX, formatSubject } from '../../mail/messages';
import { getAttendeeEmail, toIcsPartstat } from '../attendees';
import {
    ICAL_ALARM_ACTION,
    ICAL_ATTENDEE_STATUS,
    ICAL_METHOD,
    NOTIFICATION_TYPE_API,
    RECURRING_TYPES,
} from '../constants';
import { getSelfAddressData } from '../deserialize';
import { getDisplayTitle } from '../helper';
import { getSupportedStringValue } from '../icsSurgery/vcal';
import { getIsRruleEqual } from '../recurrence/rruleEqual';
import { stripAllTags } from '../sanitize';
import { fromTriggerString, serialize } from '../vcal';
import { getAllDayInfo, getHasModifiedDateTimes, getIsEquivalentAttendee, propertyToUTCDate } from '../vcalConverter';
import {
    getAttendeePartstat,
    getAttendeeRole,
    getHasRecurrenceId,
    getIsAlarmComponent,
    getPropertyTzid,
} from '../vcalHelper';
import {
    getIsAllDay,
    getIsEventCancelled,
    getSequence,
    withDtstamp,
    withSummary,
    withoutRedundantDtEnd,
    withoutRedundantRrule,
} from '../veventHelper';

export const getParticipantHasAddressID = (
    participant: Participant
): participant is RequireSome<Participant, 'addressID'> => {
    return !!participant.addressID;
};

export const getParticipant = ({
    participant,
    contactEmails,
    selfAddress,
    selfAttendee,
    emailTo,
    index,
    calendarAttendees,
    xYahooUserStatus,
}: {
    participant: VcalAttendeeProperty | VcalOrganizerProperty;
    contactEmails: ContactEmail[];
    selfAddress?: Address;
    selfAttendee?: VcalAttendeeProperty;
    emailTo?: string;
    index?: number;
    calendarAttendees?: Attendee[];
    xYahooUserStatus?: string;
}): Participant => {
    const emailAddress = getAttendeeEmail(participant);
    const canonicalInternalEmail = canonicalizeInternalEmail(emailAddress);
    const canonicalEmail = canonicalizeEmailByGuess(emailAddress);
    const isSelf = selfAddress && canonicalizeInternalEmail(selfAddress.Email) === canonicalInternalEmail;
    const isYou = emailTo ? canonicalizeInternalEmail(emailTo) === canonicalInternalEmail : isSelf;
    const contact = contactEmails.find(({ Email }) => canonicalizeEmail(Email) === canonicalEmail);
    const participantName = participant?.parameters?.cn || emailAddress;
    const displayName = (isSelf && selfAddress?.DisplayName) || contact?.Name || participantName;
    const result: Participant = {
        vcalComponent: participant,
        name: participantName,
        emailAddress,
        partstat: getAttendeePartstat(participant, xYahooUserStatus),
        displayName: isYou ? c('Participant name').t`You` : displayName,
        displayEmail: emailAddress,
    };
    const { role, email, 'x-pm-token': token } = (participant as VcalAttendeeProperty).parameters || {};
    const calendarAttendee = token ? calendarAttendees?.find(({ Token }) => Token === token) : undefined;
    if (role) {
        result.role = getAttendeeRole(participant);
    }
    if (email) {
        result.displayEmail = email;
    }
    if (token) {
        result.token = token;
    }
    if (calendarAttendee) {
        result.updateTime = calendarAttendee.UpdateTime;
        result.attendeeID = calendarAttendee.ID;
    }
    if (selfAddress && selfAttendee && isSelf) {
        result.addressID = selfAddress.ID;
        // Use Proton form of the email address (important for sending email)
        result.emailAddress = getSupportedPlusAlias({
            selfAttendeeEmail: getAttendeeEmail(selfAttendee),
            selfAddressEmail: selfAddress.Email,
        });
        // Use Proton name when sending out the email
        result.name = selfAddress.DisplayName || participantName;
    }
    if (index !== undefined) {
        result.attendeeIndex = index;
    }
    return result;
};

/**
 * Build ad-hoc participant data for a party crasher
 * (to fake a party crasher actually being in the ICS)
 */
export const buildPartyCrasherParticipantData = (
    originalTo: string,
    ownAddresses: Address[],
    contactEmails: ContactEmail[],
    attendees: VcalAttendeeProperty[]
): { participant?: Participant; selfAttendee: VcalAttendeeProperty; selfAddress: Address } | undefined => {
    let isCatchAllPartyCrasher = false;
    const selfInternalAddresses = ownAddresses.filter((address) => !getIsAddressExternal(address));

    const canonicalizedOriginalTo = canonicalizeInternalEmail(originalTo);
    let selfAddress = selfInternalAddresses.find(
        ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizedOriginalTo
    );

    if (!selfAddress) {
        const catchAllAddress = selfInternalAddresses.find(({ CatchAll }) => CatchAll);
        if (catchAllAddress) {
            // if any address is catch-all, that will be detected as party crasher
            isCatchAllPartyCrasher = true;
            selfAddress = catchAllAddress;
        } else {
            return;
        }
    }

    const fakeOriginalTo = isCatchAllPartyCrasher ? selfAddress.Email : originalTo;
    const selfAttendee: VcalAttendeeProperty = {
        value: buildMailTo(fakeOriginalTo),
        parameters: {
            cn: originalTo,
            partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
        },
    };

    return {
        participant: getParticipant({
            participant: selfAttendee,
            selfAddress,
            selfAttendee,
            contactEmails,
            index: attendees.length,
            emailTo: fakeOriginalTo,
        }),
        selfAttendee,
        selfAddress,
    };
};

interface CreateInviteVeventParams {
    method: ICAL_METHOD;
    attendeesTo?: VcalAttendeeProperty[];
    vevent: VcalVeventComponent;
    keepDtstamp?: boolean;
}

export const createInviteVevent = ({ method, attendeesTo, vevent, keepDtstamp }: CreateInviteVeventParams) => {
    if ([ICAL_METHOD.REPLY, ICAL_METHOD.CANCEL].includes(method) && attendeesTo?.length) {
        const propertiesToKeepForCancel: (keyof VcalVeventComponent)[] = ['x-pm-shared-event-id'];
        const propertiesToKeepForReply: (keyof VcalVeventComponent)[] = ['x-pm-proton-reply', 'exdate'];
        const keepDtStampProperty: (keyof VcalVeventComponent)[] = ['dtstamp'];

        // only put RFC-mandatory fields to make reply as short as possible
        // rrule, summary and location are also included for a better UI in the external provider widget
        const propertiesToKeep: (keyof VcalVeventComponent)[] = [
            'uid',
            'dtstart',
            'comment',
            'dtend',
            'sequence',
            'recurrence-id',
            'organizer',
            'rrule',
            'location',
            'summary',
            ...(keepDtstamp ? keepDtStampProperty : []),
            ...(method === ICAL_METHOD.CANCEL ? propertiesToKeepForCancel : []),
            ...(method === ICAL_METHOD.REPLY ? propertiesToKeepForReply : []),
        ];

        const attendee = attendeesTo.map(({ value, parameters }) => {
            const { partstat } = parameters || {};
            if (method === ICAL_METHOD.REPLY) {
                if (!partstat) {
                    throw new Error('Cannot reply without participant status');
                }

                const parameters: Record<string, string> = {};

                parameters.partstat = partstat;

                return {
                    value,
                    parameters,
                };
            }
            return { value };
        });

        const veventWithoutRedundantDtEnd = withoutRedundantDtEnd(
            withDtstamp({
                ...pick(vevent, propertiesToKeep),
                component: 'vevent',
                attendee,
            })
        );

        return method === ICAL_METHOD.REPLY
            ? withoutRedundantRrule(veventWithoutRedundantDtEnd)
            : veventWithoutRedundantDtEnd;
    }

    if (method === ICAL_METHOD.REQUEST) {
        // strip alarms
        const propertiesToOmit: (keyof VcalVeventComponent)[] = ['components', 'x-pm-proton-reply', 'color'];
        // use current time as dtstamp unless indicated otherwise
        if (!keepDtstamp) {
            propertiesToOmit.push('dtstamp');
        }
        // SUMMARY is mandatory in a REQUEST ics
        const veventWithSummary = withSummary(vevent);
        return withoutRedundantDtEnd(withDtstamp(omit(veventWithSummary, propertiesToOmit) as VcalVeventComponent));
    }
};

interface CreateInviteIcsParams {
    method: ICAL_METHOD;
    prodId: string;
    vevent: VcalVeventComponent;
    attendeesTo?: VcalAttendeeProperty[];
    vtimezones?: VcalVtimezoneComponent[];
    sharedEventID?: string;
    keepDtstamp?: boolean;
}

export const createInviteIcs = ({
    method,
    prodId,
    attendeesTo,
    vevent,
    vtimezones,
    keepDtstamp,
}: CreateInviteIcsParams): string => {
    // use current time as dtstamp
    const inviteVevent = createInviteVevent({ method, vevent, attendeesTo, keepDtstamp });
    if (!inviteVevent) {
        throw new Error('Invite vevent failed to be created');
    }
    const inviteVcal: RequireSome<VcalVcalendar, 'components'> = {
        component: 'vcalendar',
        components: [inviteVevent],
        prodid: { value: prodId },
        version: { value: '2.0' },
        method: { value: method },
        calscale: { value: 'GREGORIAN' },
    };

    if (vtimezones?.length) {
        inviteVcal.components = [...vtimezones, ...inviteVcal.components];
    }

    return serialize(inviteVcal);
};

export const findAttendee = (email: string, attendees: VcalAttendeeProperty[] = []) => {
    // treat all emails as internal. This is not fully correct (TO BE IMPROVED),
    // but it's better to have some false positives rather than many false negatives
    const canonicalEmail = canonicalizeInternalEmail(email);
    const index = attendees.findIndex(
        (attendee) => canonicalizeInternalEmail(getAttendeeEmail(attendee)) === canonicalEmail
    );
    const attendee = index !== -1 ? attendees[index] : undefined;
    return { index, attendee };
};

export const getVeventWithDefaultCalendarAlarms = (vevent: VcalVeventComponent, calendarSettings: CalendarSettings) => {
    const { components } = vevent;

    const isAllDay = getIsAllDay(vevent);
    const notifications = isAllDay
        ? calendarSettings.DefaultFullDayNotifications
        : calendarSettings.DefaultPartDayNotifications;
    const valarmComponents = notifications.map<VcalValarmComponent>(({ Trigger, Type }) => ({
        component: 'valarm',
        action: { value: Type === NOTIFICATION_TYPE_API.EMAIL ? ICAL_ALARM_ACTION.EMAIL : ICAL_ALARM_ACTION.DISPLAY },
        trigger: { value: fromTriggerString(Trigger) },
    }));

    return {
        ...vevent,
        components: components ? components.concat(valarmComponents) : valarmComponents,
    };
};

export const getInvitedVeventWithAlarms = ({
    vevent,
    partstat,
    calendarSettings,
    oldHasDefaultNotifications,
    oldPartstat,
}: {
    vevent: VcalVeventComponent;
    partstat: ICAL_ATTENDEE_STATUS;
    calendarSettings?: CalendarSettings;
    oldHasDefaultNotifications?: boolean;
    oldPartstat?: ICAL_ATTENDEE_STATUS;
}) => {
    const { components } = vevent;
    const alarmComponents = components?.filter((component) => getIsAlarmComponent(component));
    const otherComponents = components?.filter((component) => !getIsAlarmComponent(component));

    if ([ICAL_ATTENDEE_STATUS.DECLINED, ICAL_ATTENDEE_STATUS.NEEDS_ACTION].includes(partstat)) {
        // remove all alarms in this case
        if (otherComponents?.length) {
            return {
                vevent: { ...vevent, components: otherComponents },
                hasDefaultNotifications: false,
            };
        }
        return {
            vevent: { ...vevent, components: [] },
            hasDefaultNotifications: false,
        };
    }
    const leaveAlarmsUntouched = oldPartstat
        ? [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE].includes(oldPartstat) ||
          !!alarmComponents?.length
        : false;
    if (leaveAlarmsUntouched) {
        return {
            vevent,
            hasDefaultNotifications: oldHasDefaultNotifications || false,
        };
    }
    // otherwise add default calendar alarms
    if (!calendarSettings) {
        throw new Error('Cannot retrieve calendar default notifications');
    }

    return {
        vevent: getVeventWithDefaultCalendarAlarms(vevent, calendarSettings),
        hasDefaultNotifications: true,
    };
};

export const getSelfAttendeeToken = (vevent?: VcalVeventComponent, addresses: Address[] = []) => {
    if (!vevent?.attendee) {
        return;
    }
    const { selfAddress, selfAttendeeIndex } = getSelfAddressData({
        organizer: vevent.organizer,
        attendees: vevent.attendee,
        addresses,
    });
    if (!selfAddress || selfAttendeeIndex === undefined) {
        return;
    }
    return vevent.attendee[selfAttendeeIndex].parameters?.['x-pm-token'];
};

export const generateVtimezonesComponents = async (
    { dtstart, dtend, 'recurrence-id': recurrenceId, exdate = [] }: VcalVeventComponent,
    getVTimezones: GetVTimezonesMap
): Promise<VcalVtimezoneComponent[]> => {
    const timezones = [dtstart, dtend, recurrenceId, ...exdate]
        .filter(isTruthy)
        .map(unary(getPropertyTzid))
        .filter(isTruthy);

    const vtimezonesObject = await getVTimezones(timezones);
    return Object.values(vtimezonesObject)
        .filter(isTruthy)
        .map(({ vtimezone }) => vtimezone);
};

const getFormattedDateInfo = (vevent: VcalVeventComponent, options: Options = { locale: dateLocale }) => {
    const { dtstart, dtend } = vevent;
    const { isAllDay, isSingleAllDay } = getAllDayInfo(dtstart, dtend);
    if (isAllDay) {
        return {
            formattedStart: formatUTC(toUTCDate(dtstart.value), 'cccc PPP', options),
            formattedEnd: dtend ? formatUTC(addDays(toUTCDate(dtend.value), -1), 'cccc PPP', options) : undefined,
            isAllDay,
            isSingleAllDay,
        };
    }
    const formattedStartDateTime = formatUTC(toUTCDate(dtstart.value), 'cccc PPPp', options);
    const formattedEndDateTime = dtend ? formatUTC(toUTCDate(dtend.value), 'cccc PPPp', options) : undefined;
    const { offset: startOffset } = getTimezoneOffset(propertyToUTCDate(dtstart), getPropertyTzid(dtstart) || 'UTC');
    const { offset: endOffset } = dtend
        ? getTimezoneOffset(propertyToUTCDate(dtend), getPropertyTzid(dtend) || 'UTC')
        : { offset: 0 };
    const formattedStartOffset = `GMT${formatTimezoneOffset(startOffset)}`;
    const formattedEndOffset = `GMT${formatTimezoneOffset(endOffset)}`;
    return {
        formattedStart: `${formattedStartDateTime} (${formattedStartOffset})`,
        formattedEnd: formattedEndDateTime ? `${formattedEndDateTime} (${formattedEndOffset})` : undefined,
        isAllDay,
        isSingleAllDay,
    };
};

export const generateEmailSubject = ({
    method,
    vevent,
    isCreateEvent,
    dateFormatOptions,
}: {
    method: ICAL_METHOD;
    vevent: VcalVeventComponent;
    isCreateEvent?: boolean;
    dateFormatOptions?: Options;
}) => {
    const { formattedStart, isSingleAllDay } = getFormattedDateInfo(withoutRedundantDtEnd(vevent), dateFormatOptions);
    const { REQUEST, CANCEL, REPLY } = ICAL_METHOD;

    if (method === REQUEST) {
        const isSingleEdit = getHasRecurrenceId(vevent);
        if (isSingleAllDay) {
            return isCreateEvent && !isSingleEdit
                ? c('Email subject').t`Invitation for an event on ${formattedStart}`
                : c('Email subject').t`Update for an event on ${formattedStart}`;
        }

        return isCreateEvent && !isSingleEdit
            ? c('Email subject').t`Invitation for an event starting on ${formattedStart}`
            : c('Email subject').t`Update for an event starting on ${formattedStart}`;
    }

    if (method === CANCEL) {
        return isSingleAllDay
            ? c('Email subject').t`Cancellation of an event on ${formattedStart}`
            : c('Email subject').t`Cancellation of an event starting on ${formattedStart}`;
    }

    if (method === REPLY) {
        return isSingleAllDay
            ? formatSubject(c('Email subject').t`Invitation for an event on ${formattedStart}`, RE_PREFIX)
            : formatSubject(c('Email subject').t`Invitation for an event starting on ${formattedStart}`, RE_PREFIX);
    }

    throw new Error('Unexpected method');
};

const getWhenText = (vevent: VcalVeventComponent, dateFormatOptions?: Options) => {
    const { formattedStart, formattedEnd, isAllDay, isSingleAllDay } = getFormattedDateInfo(vevent, dateFormatOptions);
    if (isAllDay) {
        return isSingleAllDay || !formattedEnd
            ? c('Email body for invitation (date part)').t`TIME:
${formattedStart} (all day)`
            : c('Email body for invitation (date part)').t`TIME:
${formattedStart} - ${formattedEnd}`;
    }
    return formattedEnd
        ? c('Email body for invitation (date part)').t`TIME:
${formattedStart} - ${formattedEnd}`
        : c('Email body for invitation (date part)').t`TIME:
${formattedStart}`;
};

const buildUpdatedFieldText = (updatedBodyText: string, updatedFieldText: string, field: string) => {
    // translator: text to display in the message body of an updated event when a certain field has been removed
    const removedFieldText = c('Email body for invitation (event details part)').t`Removed`;

    // If field is updated and empty, the user removed it.
    // In that case we want to display a text to let the user know that the field has been removed.
    const hasRemovedField = updatedFieldText === '';

    if (updatedBodyText === '') {
        return hasRemovedField
            ? `${field}:
${removedFieldText}`
            : updatedFieldText;
    }
    return hasRemovedField
        ? `${updatedBodyText}

${field}:
${removedFieldText}`
        : `${updatedBodyText}

${updatedFieldText}`;
};

const getUpdateEmailBodyText = ({
    vevent,
    oldVevent,
    eventTitle,
    whenText,
    locationText,
    descriptionText,
    commentText,
}: {
    vevent: VcalVeventComponent;
    oldVevent: VcalVeventComponent;
    eventTitle: string;
    whenText: string;
    locationText: string;
    descriptionText: string;
    commentText: string;
}) => {
    const hasSameTime = !getHasModifiedDateTimes(vevent, oldVevent);
    const hasSameTitle = getSupportedStringValue(vevent.summary) === getSupportedStringValue(oldVevent.summary);
    const hasSameLocation = getSupportedStringValue(vevent.location) === getSupportedStringValue(oldVevent.location);
    const hasSameDescription =
        getSupportedStringValue(vevent.description) === getSupportedStringValue(oldVevent.description);
    const hasSameComment =
        getSupportedStringValue(vevent.comment?.[0]) === getSupportedStringValue(oldVevent.comment?.[0]);

    let updatedBodyText = '';
    if (!hasSameTitle) {
        updatedBodyText = buildUpdatedFieldText(updatedBodyText, eventTitle, 'TITLE');
    }
    if (!hasSameTime) {
        updatedBodyText = buildUpdatedFieldText(updatedBodyText, whenText, 'TIME');
    }
    if (!hasSameLocation) {
        updatedBodyText = buildUpdatedFieldText(updatedBodyText, locationText, 'LOCATION');
    }
    if (!hasSameDescription) {
        updatedBodyText = buildUpdatedFieldText(updatedBodyText, descriptionText, 'DESCRIPTION');
    }
    if (!hasSameComment) {
        updatedBodyText = buildUpdatedFieldText(updatedBodyText, commentText, 'NOTE');
    }
    return updatedBodyText;
};

const getEmailBodyTexts = (
    vevent: VcalVeventComponent,
    oldVevent?: VcalVeventComponent,
    dateFormatOptions?: Options
) => {
    const { summary, location, description, comment } = vevent;
    const eventTitle = getDisplayTitle(summary?.value);
    const eventLocation = location?.value;
    const eventDescription = description?.value;
    // Access the first comment's value if it exists
    const eventComment = comment && comment.length > 0 ? comment[0].value : undefined;

    const whenText = getWhenText(vevent, dateFormatOptions);
    const locationText = eventLocation
        ? c('Email body for invitation (location part)').t`LOCATION:
${eventLocation}`
        : '';
    const descriptionText = eventDescription
        ? c('Email body for description (description part)').t`DESCRIPTION:
${eventDescription}`
        : '';
    const commentText = eventComment
        ? c('Email body for comment (comment part)').t`NOTE:
${eventComment}`
        : '';
    const locationAndDescriptionText =
        locationText && descriptionText
            ? `${locationText}

${descriptionText}`
            : `${locationText || descriptionText}`;

    // Add the comment to the details if it exists
    const detailsWithComment = commentText
        ? `${
              locationAndDescriptionText
                  ? `${locationAndDescriptionText}

${commentText}`
                  : commentText
          }`
        : locationAndDescriptionText;

    const eventDetailsText = detailsWithComment
        ? `${whenText}

${detailsWithComment}`
        : `${whenText}`;

    const titleText = `TITLE:
${eventTitle}`;
    const updateEventDetailsText = oldVevent
        ? getUpdateEmailBodyText({
              vevent,
              oldVevent,
              eventTitle: titleText,
              whenText,
              locationText,
              descriptionText,
              commentText,
          })
        : undefined;

    return { eventTitle, eventDetailsText, updateEventDetailsText };
};

/**
 * Checks if a comment has been updated, added, or removed between two versions of an event
 */
export const isCommentUpdated = (vevent?: VcalVeventComponent, oldVevent?: VcalVeventComponent): boolean => {
    const newComment = vevent?.comment;
    const oldComment = oldVevent?.comment;

    return !!(
        // Case 1: Both have comments but values are different
        (
            (newComment?.[0]?.value && oldComment?.[0]?.value && newComment[0].value !== oldComment[0].value) ||
            // Case 2: Old comment exists but new comment doesn't (comment was removed)
            (oldComment?.[0]?.value && (!newComment || !newComment[0]?.value)) ||
            // Case 3: New comment exists but old comment doesn't (comment was added)
            (newComment?.[0]?.value && (!oldComment || !oldComment[0]?.value))
        )
    );
};

/**
 * Helper function to create consistent event update messages
 */
const createUpdateMessage = ({
    messageType,
    updateEventDetailsText,
    commentStatus,
    hasUpdatedComment,
}: {
    messageType: 'single' | 'recurring' | 'regular';
    updateEventDetailsText: string;
    commentStatus: string;
    hasUpdatedComment: boolean;
}) => {
    const hasUpdatedText = updateEventDetailsText && updateEventDetailsText.trim() !== '';

    let messageIntro;
    if (messageType === 'single') {
        messageIntro = c('Email body for invitation').t`This event occurrence was updated.`;
    } else if (messageType === 'recurring') {
        messageIntro = c('Email body for invitation').t`All events in this series were updated.`;
    } else {
        messageIntro = c('Email body for invitation').t`This event was updated.`;
    }

    // If there's updated text or a comment change that needs the "Here's what changed" header,
    // format with exactly two spaces after the newline before "Here's what changed:"
    if (hasUpdatedText || (hasUpdatedComment && commentStatus)) {
        const formattedComment = commentStatus ? `\n\n${commentStatus}` : '';
        return `${messageIntro}\n\nHere's what changed:\n\n${updateEventDetailsText}${formattedComment}`;
    }

    // If there's only a comment update without the header
    if (commentStatus) {
        return `${messageIntro}\n\n${commentStatus}`;
    }

    // No changes or comments
    return messageIntro;
};

/**
 * Helper function to create consistent response messages (accept/tentative/decline)
 */
const createResponseMessage = ({
    emailAddress,
    responseType,
    eventTitle,
    commentStatus,
    updateEventDetailsText,
    hasUpdatedComment,
}: {
    emailAddress: string;
    responseType: 'accepted' | 'tentatively accepted' | 'declined';
    eventTitle: string;
    commentStatus: string;
    updateEventDetailsText: string;
    hasUpdatedComment: boolean;
}) => {
    const hasUpdatedText = updateEventDetailsText && updateEventDetailsText.trim() !== '';

    // Use separate translated strings for each response type
    let responseMessage;
    if (responseType === 'accepted') {
        responseMessage = c('Email body for response to invitation')
            .t`${emailAddress} accepted your invitation to ${eventTitle}`;
    } else if (responseType === 'tentatively accepted') {
        responseMessage = c('Email body for response to invitation')
            .t`${emailAddress} tentatively accepted your invitation to ${eventTitle}`;
    } else if (responseType === 'declined') {
        responseMessage = c('Email body for response to invitation')
            .t`${emailAddress} declined your invitation to ${eventTitle}`;
    } else {
        throw new Error('Invalid response type');
    }

    // Only show "Here's what changed" if there were actual property changes, not just for a new comment
    if (hasUpdatedText) {
        return `${responseMessage}\n\n${c('Email body for invitation').t`Here's what changed:`}\n\n${updateEventDetailsText}${commentStatus ? `\n\n${commentStatus}` : ''}`;
    }

    // For comment updates, don't include "Here's what changed" header
    if (hasUpdatedComment) {
        return `${responseMessage}\n\n${commentStatus}`;
    }

    // If there's no text change but there is a comment, just add the comment with proper spacing
    if (commentStatus) {
        return `${responseMessage}\n\n${commentStatus}`;
    }

    // No changes and no comment, just return the response message
    return responseMessage;
};

/**
 * Helper function to create consistent cancellation messages
 */
const createCancellationMessage = ({
    isSingleOccurrence,
    eventTitle,
    commentStatus,
    updateEventDetailsText,
}: {
    isSingleOccurrence: boolean;
    eventTitle: string;
    commentStatus: string;
    updateEventDetailsText: string;
}) => {
    const messageIntro = isSingleOccurrence
        ? c('Email body for invitation').t`This event occurrence was canceled.`
        : c('Email body for invitation').t`${eventTitle} was canceled.`;

    const hasUpdatedText = updateEventDetailsText && updateEventDetailsText.trim() !== '';

    // If there's updated text, show "Here's what changed"
    if (hasUpdatedText) {
        return `${messageIntro}\n\n${c('Email body for invitation').t`Here's what changed:`}\n\n${updateEventDetailsText}${commentStatus ? `\n\n${commentStatus}` : ''}`;
    }

    // If only a comment is present, include "Here's what changed:" header as expected in tests
    if (commentStatus) {
        return `${messageIntro}\n\n${c('Email body for invitation').t`Here's what changed:`}\n${commentStatus}`;
    }

    // Regular cancellation without comment
    return messageIntro;
};

export const generateEmailBody = ({
    method,
    vevent,
    oldVevent,
    isCreateEvent,
    partstat,
    emailAddress,
    options,
    recurringType,
}: {
    method: ICAL_METHOD;
    vevent: VcalVeventComponent;
    oldVevent?: VcalVeventComponent;
    isCreateEvent?: boolean;
    emailAddress?: string;
    partstat?: ICAL_ATTENDEE_STATUS;
    options?: Options;
    recurringType?: RECURRING_TYPES;
}) => {
    const { eventTitle, eventDetailsText, updateEventDetailsText } = getEmailBodyTexts(
        withoutRedundantDtEnd(vevent),
        oldVevent ? withoutRedundantDtEnd(oldVevent) : undefined,
        options
    );
    const hasUpdatedText = updateEventDetailsText && updateEventDetailsText !== '';

    // Get comment directly from vevent to append to the email body
    const comment = vevent.comment;
    const commentText =
        comment && comment.length > 0 ? `${c('Email body for invitation').t`NOTE:`}\n${comment[0].value}` : '';

    // Check if comment has been updated
    const hasUpdatedComment = isCommentUpdated(vevent, oldVevent);

    if (method === ICAL_METHOD.REQUEST) {
        // For REQUEST method, don't include the comment in commentStatus if it's already in updateEventDetailsText
        // This prevents duplication of the note
        const shouldIncludeComment = !hasUpdatedText || !hasUpdatedComment;
        const commentStatus = shouldIncludeComment ? commentText : '';

        if (getHasRecurrenceId(vevent)) {
            return createUpdateMessage({
                messageType: 'single',
                updateEventDetailsText: hasUpdatedText ? updateEventDetailsText : '',
                commentStatus,
                hasUpdatedComment,
            });
        }

        if (recurringType === RECURRING_TYPES.ALL) {
            return createUpdateMessage({
                messageType: 'recurring',
                updateEventDetailsText: hasUpdatedText ? updateEventDetailsText : '',
                commentStatus,
                hasUpdatedComment,
            });
        }

        if (isCreateEvent) {
            // For new invites, the comment is already included in eventDetailsText - we don't need to add it again
            return `You are invited to ${eventTitle}.\n\n${eventDetailsText}`;
        }

        return createUpdateMessage({
            messageType: 'regular',
            updateEventDetailsText: hasUpdatedText ? updateEventDetailsText : '',
            commentStatus,
            hasUpdatedComment,
        });
    }

    if (method === ICAL_METHOD.CANCEL) {
        // For CANCEL method, don't include the comment in commentStatus if it's already in updateEventDetailsText
        // This prevents duplication of the note
        const shouldIncludeComment = !hasUpdatedText || !hasUpdatedComment;
        const commentStatus = shouldIncludeComment ? commentText : '';

        return createCancellationMessage({
            isSingleOccurrence: !!getHasRecurrenceId(vevent),
            eventTitle,
            commentStatus,
            updateEventDetailsText: updateEventDetailsText || '',
        });
    }

    if (method === ICAL_METHOD.REPLY) {
        if (!partstat || !emailAddress) {
            throw new Error('Missing parameters for reply body');
        }

        // For REPLY method, don't include the comment in commentStatus if it's already in updateEventDetailsText
        // This prevents duplication of the note
        const shouldIncludeComment = !hasUpdatedText || !hasUpdatedComment;
        const commentStatus = shouldIncludeComment ? commentText : '';

        let responseType: 'accepted' | 'tentatively accepted' | 'declined';

        if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
            responseType = 'accepted';
        } else if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
            responseType = 'tentatively accepted';
        } else if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
            responseType = 'declined';
        } else {
            throw new Error('Unanswered partstat');
        }

        // Remove debug logs and suppression logic
        return createResponseMessage({
            emailAddress,
            responseType,
            eventTitle,
            commentStatus,
            updateEventDetailsText: updateEventDetailsText || '',
            hasUpdatedComment, // pass raw value directly
        });
    }

    throw new Error('Unexpected method');
};

export const getIcsMessageWithPreferences = (globalSign: number) => ({
    MIMEType: MIME_TYPES.PLAINTEXT,
    Flags: globalSign ? MESSAGE_FLAGS.FLAG_SIGN : undefined,
});

export const getHasUpdatedInviteData = ({
    newVevent,
    oldVevent,
    hasModifiedDateTimes,
    hasModifiedRrule,
}: {
    newVevent: VcalVeventComponent;
    oldVevent?: VcalVeventComponent;
    hasModifiedDateTimes?: boolean;
    hasModifiedRrule?: boolean;
}) => {
    if (!oldVevent) {
        return false;
    }
    const hasUpdatedDateTimes = hasModifiedDateTimes ?? getHasModifiedDateTimes(newVevent, oldVevent);

    const keys: VcalComponentKeys[] = [
        'summary',
        'description',
        'location',
        'x-pm-conference-id',
        'x-pm-conference-url',
    ];
    const hasUpdatedNonBreakingKey = keys.some((key) => {
        const newValue = getSupportedStringValue(newVevent[key] as VcalStringProperty);
        const oldValue = getSupportedStringValue(oldVevent[key] as VcalStringProperty);

        // Sanitize to better diff detection, and unescape characters
        // `oldvalue` is the original event value, so it can contain HTML tags
        // `newValue` is supposed to be already sanitized
        // Always doing the computation because sometimes the new values is undefined, but not the old one
        const cleanedNewValue = stripAllTags(unescape(newValue || '')).trim();
        const cleanedOldValue = stripAllTags(unescape(oldValue || '')).trim();
        return cleanedNewValue !== cleanedOldValue;
    });

    const hasUpdatedRrule = hasModifiedRrule ?? !getIsRruleEqual(newVevent.rrule, oldVevent.rrule);
    return hasUpdatedDateTimes || hasUpdatedNonBreakingKey || hasUpdatedRrule;
};

export const getInviteVeventWithUpdatedParstats = (
    newVevent: VcalVeventComponent,
    oldVevent: VcalVeventComponent,
    method?: ICAL_METHOD
) => {
    if (method === ICAL_METHOD.REQUEST && getSequence(newVevent) > getSequence(oldVevent)) {
        if (!newVevent.attendee?.length) {
            return { ...newVevent };
        }
        const withResetPartstatAttendees = newVevent.attendee.map((attendee) => ({
            ...attendee,
            parameters: {
                ...attendee.parameters,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            },
        }));
        return { ...newVevent, attendee: withResetPartstatAttendees };
    }
    return { ...newVevent };
};

export const getResetPartstatActions = (
    singleEdits: CalendarEvent[],
    token: string,
    partstat: ICAL_ATTENDEE_STATUS
) => {
    const updateTime = getCurrentUnixTimestamp();
    const updateActions = singleEdits
        .map((event) => {
            if (getIsEventCancelled(event)) {
                // no need to reset the partsat as it should have been done already
                return;
            }
            const selfAttendee = event.AttendeesInfo.Attendees.find(({ Token }) => Token === token);
            if (!selfAttendee) {
                return;
            }
            const oldPartstat = toIcsPartstat(selfAttendee.Status);
            if ([ICAL_ATTENDEE_STATUS.NEEDS_ACTION, partstat].includes(oldPartstat)) {
                // no need to reset the partstat as it's already reset or it coincides with the new partstat
                return;
            }
            return {
                attendeeID: selfAttendee.ID,
                eventID: event.ID,
                calendarID: event.CalendarID,
                updateTime,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                color: event.Color ? event.Color : undefined,
            };
        })
        .filter(isTruthy);
    const updatePartstatActions = updateActions.map((action) => omit(action, ['color']));
    const updatePersonalPartActions = updateActions
        .map(({ eventID, calendarID, color }) => ({ eventID, calendarID, color }))
        .filter(isTruthy);

    return { updatePartstatActions, updatePersonalPartActions };
};

export const getHasNonCancelledSingleEdits = (singleEdits: CalendarEvent[]) => {
    return singleEdits.some((event) => !getIsEventCancelled(event));
};

export const getMustResetPartstat = (singleEdits: CalendarEvent[], token?: string, partstat?: ICAL_ATTENDEE_STATUS) => {
    if (!token || !partstat) {
        return false;
    }
    return singleEdits.some((event) => {
        if (getIsEventCancelled(event)) {
            return false;
        }
        const selfAttendee = event.AttendeesInfo.Attendees.find(({ Token }) => Token === token);
        if (!selfAttendee) {
            return false;
        }
        const oldPartstat = toIcsPartstat(selfAttendee.Status);
        if ([ICAL_ATTENDEE_STATUS.NEEDS_ACTION, partstat].includes(oldPartstat)) {
            return false;
        }
        return true;
    });
};

export const getHasModifiedAttendees = ({
    veventIcs,
    veventApi,
    attendeeIcs,
    attendeeApi,
}: {
    veventIcs: VcalVeventComponent;
    veventApi: VcalVeventComponent;
    attendeeIcs: Participant;
    attendeeApi: Participant;
}) => {
    const { attendee: attendeesIcs } = veventIcs;
    const { attendee: attendeesApi } = veventApi;
    if (!attendeesIcs) {
        return !!attendeesApi;
    }
    if (!attendeesApi || attendeesApi.length !== attendeesIcs.length) {
        return true;
    }
    // We check if attendees other than the invitation attendees have been modified
    const otherAttendeesIcs = attendeesIcs.filter(
        (attendee) => canonicalizeEmail(getAttendeeEmail(attendee)) !== canonicalizeEmail(attendeeIcs.emailAddress)
    );
    const otherAttendeesApi = attendeesApi.filter(
        (attendee) => canonicalizeEmail(getAttendeeEmail(attendee)) !== canonicalizeEmail(attendeeApi.emailAddress)
    );
    return otherAttendeesIcs.reduce((acc, attendee) => {
        if (acc === true) {
            return true;
        }
        const index = otherAttendeesApi.findIndex((oldAttendee) => getIsEquivalentAttendee(oldAttendee, attendee));
        if (index === -1) {
            return true;
        }
        otherAttendeesApi.splice(index, 1);
        return false;
    }, false);
};
