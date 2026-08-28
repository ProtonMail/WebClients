import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import { IcQuestionCircleFilled } from '@proton/icons/icons/IcQuestionCircleFilled';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';

const iconContainerClassName = 'inline-flex rounded-50 items-center justify-center partstatIcon';
const iconClassName = '';

interface Props {
    partstat: ICAL_ATTENDEE_STATUS;
}
const ParticipantStatusIcon = ({ partstat }: Props) => {
    if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
        return (
            <span className={`${iconContainerClassName} color-success`}>
                <IcCheckmarkCircleFilled className={iconClassName} size={4} />
            </span>
        );
    }
    if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
        return (
            <span className={`${iconContainerClassName} color-warning`}>
                <IcQuestionCircleFilled className={iconClassName} size={4} />
            </span>
        );
    }
    if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
        return (
            <span className={`${iconContainerClassName} color-danger`}>
                <IcCrossCircleFilled className={iconClassName} size={4} />
            </span>
        );
    }
    if (partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION) {
        return null;
    }
    return null;
};

export default ParticipantStatusIcon;
