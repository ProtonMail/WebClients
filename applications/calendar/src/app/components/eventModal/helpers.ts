import { c, msgid } from 'ttag';

import { MAX_ATTENDEES } from '@proton/shared/lib/calendar/constants';

export const getParticipantsError = ({
    isOwnedCalendar,
    numberOfAttendees,
    maxAttendees = MAX_ATTENDEES,
}: {
    isOwnedCalendar: boolean;
    numberOfAttendees: number;
    maxAttendees?: number;
}) => {
    if (!isOwnedCalendar) {
        if (numberOfAttendees > 0) {
            return c('Information about why calendar event cannot be saved')
                .t`Creating invites in a shared calendar is not allowed`;
        }
        return;
    }
    if (numberOfAttendees > maxAttendees) {
        return c('Information about why calendar event cannot be saved').ngettext(
            msgid`At most ${maxAttendees} participant is allowed per invitation`,
            `At most ${maxAttendees} participants are allowed per invitation`,
            maxAttendees
        );
    }
};
