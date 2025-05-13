import { c } from 'ttag';

import { Banner } from '@proton/atoms';
import { SettingsLink } from '@proton/components';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { getHasRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { getIsEventCancelled } from '@proton/shared/lib/calendar/veventHelper';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import type { RequireSome } from '@proton/shared/lib/interfaces/utils';

import type { InvitationModel } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventAlert = ({ model }: Props) => {
    const {
        isOrganizerMode,
        isImport,
        hasMultipleVevents,
        isOutdated,
        isPartyCrasher,
        hasProtonUID,
        invitationIcs: { method, vevent: veventIcs, attendee: attendeeIcs },
        invitationApi,
        calendarData,
        isAddressActive,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        hasNoCalendars,
    } = model;
    const isCancel = method === ICAL_METHOD.CANCEL;
    const alertClassName = 'my-4 text-break';

    /* Depending on the case, we want to display a different alert message in the ICS widget.
     * For party crashers, we have two scenarios:
     * 1- When we have a party crasher invitation from an internal organizer, the condition is blocking.
     * The party crasher alert message should be more important than other types of messages.
     * 2- However, since we can accept party crasher invitations from an external organizers,
     * the alert message will be less important than other messages (address is disabled, calendar limit reached, etc...)
     */
    const isPartyCrasherBlocking = isPartyCrasher && hasProtonUID;
    const isPartyCrasherNonBlocking = isPartyCrasher && !hasProtonUID;

    if (isImport && hasMultipleVevents) {
        return null;
    }

    /**
     * organizer mode
     */
    if (isOrganizerMode) {
        if (method !== ICAL_METHOD.REPLY || !attendeeIcs?.partstat || !invitationApi) {
            return null;
        }
        if (calendarData?.isCalendarDisabled) {
            const text =
                isOutdated || isPartyCrasher
                    ? c('Link').t`Re-enable the address linked to this calendar to manage your invitation.`
                    : c('Link').t`Re-enable the address linked to this calendar to update your invitation.`;
            return (
                <Banner className={alertClassName} variant="warning">
                    <span className="mr-2">{c('Info').t`This invitation is saved in a disabled calendar.`}</span>
                    <span>
                        <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                            {text}
                        </SettingsLink>
                    </span>
                </Banner>
            );
        }
        const singleAnswersNotSupported = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(invitationApi?.vevent);
        if (isPartyCrasher && !singleAnswersNotSupported) {
            const participantName = attendeeIcs.displayName;
            return (
                <Banner className={alertClassName} variant="warning">
                    {c('Calendar invite info').t`${participantName} is not in the participants list.`}
                </Banner>
            );
        }
        return null;
    }

    /**
     * attendee mode
     * There are priorities on the message we want to display in attendee mode.
     * 1- The user is a party crasher of the invitation and that the invitation is internal
     * 2- Invitation is outdated
     * 3- For unanswered invitations
     *   a. Invitation is cancelled
     *   b. The user address is inactive, and it's not an import
     *   c. There is no calendar data available
     *      i. User has no calendars
     *      ii. User calendars are all using disabled addresses, but has not reached the calendar number limit
     *      iii. User calendars are all using disabled addresses, but has reached the calendar number limit
     * 4- The user is a party crasher of the invitation and the invitation is external
     */
    if (isPartyCrasherBlocking) {
        // In case the user is a party crasher, we want to display a different message if organizer is internal or external.
        // If organizer is internal, we cannot accept the event for now.
        // But we can for external organizers.
        return (
            <Banner className={alertClassName} variant="warning">
                {c('Calendar invite info')
                    .t`You cannot respond to ${BRAND_NAME} invites if you're not on the participants list at the moment.`}
            </Banner>
        );
    }
    // attendee can take no action for outdated invitations
    if (isOutdated) {
        return null;
    }
    // the invitation is unanswered
    if (!invitationApi) {
        if (isCancel) {
            return null;
        }
        if (!isAddressActive && !isImport) {
            return (
                <Banner className={alertClassName} variant="warning">
                    <span className="mr-2">{c('Info').t`You cannot reply from the invited address.`}</span>
                    <span>
                        <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                            {c('Link').t`Enable your address to answer this invitation.`}
                        </SettingsLink>
                    </span>
                </Banner>
            );
        }
        if (!calendarData) {
            // no default calendar was found, which means that either the user has no calendar,
            // all user calendars are disabled, or no calendar is active yet
            if (hasNoCalendars) {
                return null;
            }
            if (canCreateCalendar) {
                return (
                    <Banner className={alertClassName} variant="warning">
                        <span className="mr-2">{c('Info').t`All your calendars are disabled.`}</span>
                        <SettingsLink path={getCalendarsSettingsPath()} app={APPS.PROTONCALENDAR}>
                            {c('Link').t`Create a calendar linked to an active email address.`}
                        </SettingsLink>
                    </Banner>
                );
            }
            if (maxUserCalendarsDisabled) {
                return (
                    <Banner className={alertClassName} variant="warning">
                        <span className="mr-2">{c('Info').t`All your calendars are disabled.`}</span>
                        <span className="mr-2">
                            <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                                {c('Link').t`Enable an email address linked to one of your calendars.`}
                            </SettingsLink>
                        </span>
                        <span>
                            <SettingsLink path={getCalendarsSettingsPath()} app={APPS.PROTONCALENDAR}>
                                {c('Link')
                                    .t`Or you can delete one of your calendars and create a new one linked to an active email address.`}
                            </SettingsLink>
                        </span>
                    </Banner>
                );
            }
        }
        if (!isPartyCrasherNonBlocking) {
            return null;
        }
    }

    // for import we do not care about the state of the calendar where the event was saved
    if (isImport) {
        return null;
    }

    // the invitation has been answered
    if (invitationApi && getIsEventCancelled(invitationApi.calendarEvent)) {
        return null;
    }

    if (!isAddressActive) {
        if (isCancel) {
            return null;
        }
        return (
            <Banner className={alertClassName} variant="warning">
                <span className="mr-2">{c('Info').t`You cannot reply from the invited address.`}</span>
                <span>
                    <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                        {c('Link').t`Enable your address again to modify your answer.`}
                    </SettingsLink>
                </span>
            </Banner>
        );
    }
    if (calendarData?.isCalendarDisabled) {
        const text = isCancel
            ? c('Link').t`Enable the email address linked to the disabled calendar to cancel the event.`
            : c('Link').t`Enable the email address linked to the disabled calendar to modify your answer.`;
        return (
            <Banner className={alertClassName} variant="warning">
                <span className="mr-2">{c('Info').t`This invitation is saved in a disabled calendar.`}</span>
                <span>
                    <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                        {text}
                    </SettingsLink>
                </span>
            </Banner>
        );
    }

    if (isPartyCrasherNonBlocking) {
        return (
            <Banner className={alertClassName} variant="warning">
                {c('Calendar invite info').t`Your email address is not in the original participants list.`}
            </Banner>
        );
    }

    return null;
};

export default ExtraEventAlert;
