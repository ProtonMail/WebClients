import { c } from 'ttag';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';

const { ACCEPTED, DECLINED, TENTATIVE, DELEGATED, NEEDS_ACTION } = ICAL_ATTENDEE_STATUS;

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
        [ACCEPTED]: isYou
            ? c('Calendar invite info').t`You accepted the invitation`
            : c('Calendar invite info').t`${name} accepted the invitation`,
        [DECLINED]: isYou
            ? c('Calendar invite info').t`You declined the invitation`
            : c('Calendar invite info').t`${name} declined the invitation`,
        [TENTATIVE]: isYou
            ? c('Calendar invite info').t`You tentatively accepted the invitation`
            : c('Calendar invite info').t`${name} tentatively accepted the invitation`,
        [DELEGATED]: '',
        [NEEDS_ACTION]: isYou
            ? c('Calendar invite info').t`You haven't answered the invitation yet`
            : c('Calendar invite info').t`${name} hasn't answered the invitation yet`,
    };

    return statusMap[partstat];
};

export default getAttendanceTooltip;
