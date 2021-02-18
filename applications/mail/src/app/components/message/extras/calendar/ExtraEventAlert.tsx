import { ICAL_EVENT_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { APPS } from 'proton-shared/lib/constants';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React from 'react';
import { Alert, AppLink } from 'react-components';
import { c } from 'ttag';
import { InvitationModel } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventAlert = ({ model }: Props) => {
    const {
        isOrganizerMode,
        isOutdated,
        isPartyCrasher,
        invitationIcs: { method },
        calendarData,
        invitationApi,
        isFreeUser,
        isAddressDisabled,
        canCreateCalendar,
        maxUserCalendarsDisabled,
        hasNoCalendars,
    } = model;
    const isCancel = method === ICAL_METHOD.CANCEL;

    if (isOutdated || isFreeUser || isPartyCrasher) {
        return null;
    }

    // organizer mode
    if (isOrganizerMode) {
        if (method !== ICAL_METHOD.REPLY) {
            return null;
        }
        const partstatIcs = model.invitationIcs.attendee?.partstat;
        const partstatApi = model.invitationApi?.attendee?.partstat;
        if (!partstatIcs || !partstatApi) {
            return null;
        }
        if (calendarData?.isCalendarDisabled) {
            const text = isOutdated
                ? c('Link').t`Re-enable the address linked to this calendar to manage your invitation.`
                : c('Link').t`Re-enable the address linked to this calendar to update your invitation.`;
            return (
                <Alert type="warning">
                    <span className="mr0-5">{c('Info').t`This invitation is saved in a disabled calendar.`}</span>
                    <span>
                        <AppLink to="/settings/addresses" toApp={APPS.PROTONMAIL}>
                            {text}
                        </AppLink>
                    </span>
                </Alert>
            );
        }
        return null;
    }

    // attendee mode
    // the invitation is unanswered
    if (!invitationApi) {
        if (isCancel) {
            return null;
        }
        if (isAddressDisabled) {
            return (
                <Alert type="warning">
                    <span className="mr0-5">{c('Info').t`The invited email address is disabled.`}</span>
                    <span>
                        <AppLink to="/settings/addresses" toApp={APPS.PROTONMAIL}>
                            {c('Link').t`Enable your address to answer this invitation.`}
                        </AppLink>
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
                    <Alert type="warning">
                        <span className="mr0-5">{c('Info').t`All your calendars are disabled.`}</span>
                        <AppLink to="/settings/calendars" toApp={APPS.PROTONCALENDAR}>
                            {c('Link').t`Create a calendar linked to an active email address.`}
                        </AppLink>
                    </Alert>
                );
            }
            if (maxUserCalendarsDisabled) {
                return (
                    <Alert type="warning">
                        <span className="mr0-5">{c('Info').t`All your calendars are disabled.`}</span>
                        <span className="mr0-5">
                            <AppLink to="/settings/addresses" toApp={APPS.PROTONMAIL}>
                                {c('Link').t`Enable an email address linked to one of your calendars.`}
                            </AppLink>
                        </span>
                        <span>
                            <AppLink to="/settings/calendars" toApp={APPS.PROTONCALENDAR}>
                                {c('Link')
                                    .t`Or you can delete one of your calendars and create a new one linked to an active email address.`}
                            </AppLink>
                        </span>
                    </Alert>
                );
            }
        }
        return null;
    }

    // the invitation has been answered
    if (invitationApi.vevent.status?.value === ICAL_EVENT_STATUS.CANCELLED) {
        return null;
    }

    if (isAddressDisabled) {
        if (isCancel) {
            return null;
        }
        return (
            <Alert type="warning">
                <span className="mr0-5">{c('Info').t`The invited email address is disabled.`}</span>
                <span>
                    <AppLink to="/settings/addresses" toApp={APPS.PROTONMAIL}>
                        {c('Link').t`Enable your address again to modify your answer.`}
                    </AppLink>
                </span>
            </Alert>
        );
    }
    if (calendarData?.isCalendarDisabled) {
        const text = isCancel
            ? c('Link').t`Enable the email address linked to the disabled calendar to cancel the event.`
            : c('Link').t`Enable the email address linked to the disabled calendar to modify your answer.`;
        return (
            <Alert type="warning">
                <span className="mr0-5">{c('Info').t`This invitation is saved in a disabled calendar.`}</span>
                <span>
                    <AppLink to="/settings/addresses" toApp={APPS.PROTONMAIL}>
                        {text}
                    </AppLink>
                </span>
            </Alert>
        );
    }
    return null;
};

export default ExtraEventAlert;
