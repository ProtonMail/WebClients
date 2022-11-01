import { c, msgid } from 'ttag';

import { MAX_ATTENDEES } from '@proton/shared/lib/calendar/constants';

export const getParticipantsError = ({
    isOwnedCalendar,
    numberOfAttendees,
}: {
    isOwnedCalendar: boolean;
    numberOfAttendees: number;
}) => {
    if (!isOwnedCalendar) {
        if (numberOfAttendees > 0) {
            return c('Information about why calendar event cannot be saved')
                .t`Creating invites in a shared calendar is not allowed`;
        }
        return;
    }
    if (numberOfAttendees > MAX_ATTENDEES) {
        return c('Information about why calendar event cannot be saved').ngettext(
            msgid`At most ${MAX_ATTENDEES} participant is allowed per invitation`,
            `At most ${MAX_ATTENDEES} participants are allowed per invitation`,
            MAX_ATTENDEES
        );
    }
};
