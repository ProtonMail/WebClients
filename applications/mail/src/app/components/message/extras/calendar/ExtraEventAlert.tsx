import { c } from 'ttag';

import { Alert, SettingsLink } from '@proton/components';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getIsEventCancelled } from '@proton/shared/lib/calendar/veventHelper';
import { APPS } from '@proton/shared/lib/constants';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';

import { InvitationModel } from '../../../../helpers/calendar/invite';

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
        invitationIcs: { method, vevent: veventIcs, attendee: attendeeIcs },
        invitationApi,
        calendarData,
        isAddressActive,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        hasNoCalendars,
    } = model;
    const isCancel = method === ICAL_METHOD.CANCEL;
    const alertClassName = 'mb1 mt1 text-break';

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
                <Alert className={alertClassName} type="warning">
                    <span className="mr0-5">{c('Info').t`This invitation is saved in a disabled calendar.`}</span>
                    <span>
                        <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                            {text}
                        </SettingsLink>
                    </span>
                </Alert>
            );
        }
        if (isPartyCrasher && !veventIcs['recurrence-id']) {
            const participantName = attendeeIcs.displayName;
            return (
                <Alert className={alertClassName} type="warning">
                    {c('Calendar invite info').t`${participantName} is not in the participants list.`}
                </Alert>
            );
        }
        return null;
    }

    /**
     * attendee mode
     */
    if (isPartyCrasher) {
        return (
            <Alert className={alertClassName} type="warning">
                {c('Calendar invite info').t`Your email address is not in the participants list`}
            </Alert>
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
                <Alert className={alertClassName} type="warning">
                    <span className="mr0-5">{c('Info').t`You cannot reply from the invited address.`}</span>
                    <span>
                        <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                            {c('Link').t`Enable your address to answer this invitation.`}
                        </SettingsLink>
                    </span>
                </Alert>
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
                    <Alert className={alertClassName} type="warning">
                        <span className="mr0-5">{c('Info').t`All your calendars are disabled.`}</span>
                        <SettingsLink path="/calendars" app={APPS.PROTONCALENDAR}>
                            {c('Link').t`Create a calendar linked to an active email address.`}
                        </SettingsLink>
                    </Alert>
                );
            }
            if (maxUserCalendarsDisabled) {
                return (
                    <Alert className={alertClassName} type="warning">
                        <span className="mr0-5">{c('Info').t`All your calendars are disabled.`}</span>
                        <span className="mr0-5">
                            <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                                {c('Link').t`Enable an email address linked to one of your calendars.`}
                            </SettingsLink>
                        </span>
                        <span>
                            <SettingsLink path="/calendars" app={APPS.PROTONCALENDAR}>
                                {c('Link')
                                    .t`Or you can delete one of your calendars and create a new one linked to an active email address.`}
                            </SettingsLink>
                        </span>
                    </Alert>
                );
            }
        }
        return null;
    }

    // for import we do not care about the state of the calendar where the event was saved
    if (isImport) {
        return null;
    }

    // the invitation has been answered
    if (getIsEventCancelled(invitationApi.calendarEvent)) {
        return null;
    }

    if (!isAddressActive) {
        if (isCancel) {
            return null;
        }
        return (
            <Alert className={alertClassName} type="warning">
                <span className="mr0-5">{c('Info').t`You cannot reply from the invited address.`}</span>
                <span>
                    <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                        {c('Link').t`Enable your address again to modify your answer.`}
                    </SettingsLink>
                </span>
            </Alert>
        );
    }
    if (calendarData?.isCalendarDisabled) {
        const text = isCancel
            ? c('Link').t`Enable the email address linked to the disabled calendar to cancel the event.`
            : c('Link').t`Enable the email address linked to the disabled calendar to modify your answer.`;
        return (
            <Alert className={alertClassName} type="warning">
                <span className="mr0-5">{c('Info').t`This invitation is saved in a disabled calendar.`}</span>
                <span>
                    <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>
                        {text}
                    </SettingsLink>
                </span>
            </Alert>
        );
    }
    return null;
};

export default ExtraEventAlert;
