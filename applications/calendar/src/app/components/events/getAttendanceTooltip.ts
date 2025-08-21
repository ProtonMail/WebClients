import { c } from 'ttag';

import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';

const getAttendanceTooltip = ({
    partstat,
    name,
    isYou,
}: {
    partstat: ICAL_ATTENDEE_STATUS;
    name: string;
    isYou: boolean;
}) => {
    const statusMap = {
        [ICAL_ATTENDEE_STATUS.ACCEPTED]: isYou
            ? c('Calendar invite info').t`You accepted the invitation`
            : c('Calendar invite info').t`${name} accepted the invitation`,
        [ICAL_ATTENDEE_STATUS.DECLINED]: isYou
            ? c('Calendar invite info').t`You declined the invitation`
            : c('Calendar invite info').t`${name} declined the invitation`,
        [ICAL_ATTENDEE_STATUS.TENTATIVE]: isYou
            ? c('Calendar invite info').t`You tentatively accepted the invitation`
            : c('Calendar invite info').t`${name} tentatively accepted the invitation`,
        [ICAL_ATTENDEE_STATUS.DELEGATED]: '',
        [ICAL_ATTENDEE_STATUS.NEEDS_ACTION]: isYou
            ? c('Calendar invite info').t`You haven't answered the invitation yet`
            : c('Calendar invite info').t`${name} hasn't answered the invitation yet`,
    };

    return statusMap[partstat];
};

export default getAttendanceTooltip;
