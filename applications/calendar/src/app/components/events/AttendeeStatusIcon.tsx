import { Icon } from '@proton/components';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';

const iconContainerClassName = 'inline-flex rounded-50 items-center justify-center partstatIcon';
const iconClassName = '';

const IconYes = () => (
    <span className={`${iconContainerClassName} color-success`}>
        <Icon name="checkmark-circle-filled" className={iconClassName} size={3} />
    </span>
);
const IconMaybe = () => (
    <span className={`${iconContainerClassName} color-warning`}>
        <Icon name="question-circle-filled" className={iconClassName} size={3} />
    </span>
);
const IconNo = () => (
    <span className={`${iconContainerClassName} color-danger`}>
        <Icon name="cross-circle-filled" className={iconClassName} size={3} />
    </span>
);
const IconNeedsAction = () => null;

export const iconMap = {
    [ICAL_ATTENDEE_STATUS.ACCEPTED]: IconYes,
    [ICAL_ATTENDEE_STATUS.DECLINED]: IconNo,
    [ICAL_ATTENDEE_STATUS.TENTATIVE]: IconMaybe,
    [ICAL_ATTENDEE_STATUS.DELEGATED]: () => null,
    [ICAL_ATTENDEE_STATUS.NEEDS_ACTION]: IconNeedsAction,
};

interface Props {
    partstat: ICAL_ATTENDEE_STATUS;
}
const ParticipantStatusIcon = ({ partstat }: Props) => {
    if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
        return (
            <span className={`${iconContainerClassName} color-success`}>
                <Icon name="checkmark-circle-filled" className={iconClassName} size={4} />
            </span>
        );
    }
    if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
        return (
            <span className={`${iconContainerClassName} color-warning`}>
                <Icon name="question-circle-filled" className={iconClassName} size={4} />
            </span>
        );
    }
    if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
        return (
            <span className={`${iconContainerClassName} color-danger`}>
                <Icon name="cross-circle-filled" className={iconClassName} size={4} />
            </span>
        );
    }
    if (partstat === ICAL_ATTENDEE_STATUS.NEEDS_ACTION) {
        return null;
    }
    return null;
};

export default ParticipantStatusIcon;
