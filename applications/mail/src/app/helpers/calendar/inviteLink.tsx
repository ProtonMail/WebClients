import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { AppLink, SettingsLink } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { APPS } from '@proton/shared/lib/constants';
import { RequireSome } from '@proton/shared/lib/interfaces';

import OpenInCalendarButton from '../../components/message/extras/calendar/OpenInCalendarButton';
import { InvitationModel } from './invite';

const calendarAppName = getAppName(APPS.PROTONCALENDAR);

export const getCalendarEventLink = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        isOrganizerMode,
        isImport,
        hasMultipleVevents,
        hideLink,
        isPartyCrasher,
        isOutdated,
        isAddressActive,
        calendarData,
        invitationIcs: { method, attendee: attendeeIcs, vevent: veventIcs },
        invitationApi,
        hasNoCalendars,
        canCreateCalendar,
        hasDecryptionError,
    } = model;

    if (hideLink) {
        return null;
    }

    const hasAlsoReplied =
        attendeeIcs?.partstat &&
        [ICAL_ATTENDEE_STATUS.ACCEPTED, ICAL_ATTENDEE_STATUS.TENTATIVE, ICAL_ATTENDEE_STATUS.DECLINED].includes(
            attendeeIcs?.partstat
        );
    const canBeAdded = isImport;
    const canBeAnswered =
        !isOrganizerMode && method === ICAL_METHOD.REQUEST && !isOutdated && isAddressActive && !isImport;
    const canBeManaged =
        isOrganizerMode &&
        (method === ICAL_METHOD.REPLY || (method === ICAL_METHOD.COUNTER && hasAlsoReplied)) &&
        !isImport &&
        !veventIcs['recurrence-id'];
    const canBeSeenUpdated =
        [ICAL_METHOD.CANCEL, ICAL_METHOD.COUNTER, ICAL_METHOD.REFRESH].includes(method) ||
        (!isOrganizerMode && method === ICAL_METHOD.REQUEST && isOutdated);

    const safeCalendarNeedsUserAction = calendarData?.calendarNeedsUserAction && !(isPartyCrasher && !isOrganizerMode);
    // the calendar needs a user action to be active
    if (safeCalendarNeedsUserAction) {
        if (isImport) {
            return (
                <AppLink to="/" toApp={APPS.PROTONCALENDAR}>{c('Link')
                    .t`You need to activate your calendar keys to add this event`}</AppLink>
            );
        }
        if (canBeManaged) {
            return (
                <AppLink to="/" toApp={APPS.PROTONCALENDAR}>{c('Link')
                    .t`You need to activate your calendar keys to manage this invitation`}</AppLink>
            );
        }
        if (canBeAnswered) {
            return (
                <AppLink to="/" toApp={APPS.PROTONCALENDAR}>{c('Link')
                    .t`You need to activate your calendar keys to answer this invitation`}</AppLink>
            );
        }
        if (canBeSeenUpdated && invitationApi) {
            return (
                <AppLink to="/" toApp={APPS.PROTONCALENDAR}>
                    {isOrganizerMode
                        ? c('Link').t`You need to activate your calendar keys to see the updated event`
                        : c('Link').t`You need to activate your calendar keys to see the updated invitation`}
                </AppLink>
            );
        }
        return null;
    }

    if (isImport && hasMultipleVevents) {
        return (
            <SettingsLink path="/calendars#import" app={APPS.PROTONCALENDAR}>
                {c('Link')
                    .t`This ICS file contains more than one event. Please download it and import the events in ${calendarAppName}`}
            </SettingsLink>
        );
    }

    // the invitation is unanswered
    if (!invitationApi) {
        if (hasDecryptionError) {
            // the event exists in the db but couldn't be decrypted
            if (canBeManaged) {
                return (
                    <SettingsLink path="/encryption-keys#addresses" app={APPS.PROTONMAIL}>
                        {c('Link').t`You need to reactivate your keys to manage this invitation`}
                    </SettingsLink>
                );
            }
            if (canBeSeenUpdated) {
                return (
                    <SettingsLink path="/encryption-keys#addresses" app={APPS.PROTONMAIL}>
                        {isOrganizerMode
                            ? c('Link').t`You need to reactivate your keys to see the updated event`
                            : c('Link').t`You need to reactivate your keys to see the updated invitation`}
                    </SettingsLink>
                );
            }
        }
        if (hasNoCalendars && canCreateCalendar && !isPartyCrasher) {
            if (canBeAdded) {
                return (
                    <AppLink to="/" toApp={APPS.PROTONCALENDAR}>
                        {c('Link').t`Create a new calendar to add this event`}
                    </AppLink>
                );
            }
            if (canBeAnswered) {
                return (
                    <AppLink to="/" toApp={APPS.PROTONCALENDAR}>
                        {c('Link').t`Create a new calendar to answer this invitation`}
                    </AppLink>
                );
            }
            if (canBeManaged) {
                return (
                    <AppLink to="/" toApp={APPS.PROTONCALENDAR}>
                        {c('Link').t`Create a new calendar to manage your invitations`}
                    </AppLink>
                );
            }
        }
        return null;
    }

    // the invitation has been answered
    const calendarID = calendarData?.calendar.ID || '';
    const eventID = invitationApi?.calendarEvent.ID;
    const recurrenceIDProperty = invitationApi?.vevent['recurrence-id'];
    const recurrenceID = recurrenceIDProperty ? getUnixTime(propertyToUTCDate(recurrenceIDProperty)) : undefined;

    const linkString = isOutdated
        ? c('Link').t`Open updated event in ${calendarAppName}`
        : c('Link').t`Open in ${calendarAppName}`;

    return (
        <OpenInCalendarButton
            linkString={linkString}
            calendarID={calendarID}
            eventID={eventID}
            recurrenceID={recurrenceID}
        />
    );
};
