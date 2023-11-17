import { Icon } from '@proton/components';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';

const { ACCEPTED, DECLINED, TENTATIVE, DELEGATED, NEEDS_ACTION } = ICAL_ATTENDEE_STATUS;

const iconContainerClassName = 'inline-flex rounded-50 items-center justify-center partstatIcon';
const iconClassName = '';

const IconYes = () => (
    <span className={`${iconContainerClassName} color-success`}>
        <Icon name="checkmark-circle-filled" className={iconClassName} size={12} />
    </span>
);
const IconMaybe = () => (
    <span className={`${iconContainerClassName} color-warning`}>
        <Icon name="question-circle-filled" className={iconClassName} size={12} />
    </span>
);
const IconNo = () => (
    <span className={`${iconContainerClassName} color-danger`}>
        <Icon name="cross-circle-filled" className={iconClassName} size={12} />
    </span>
);
const IconNeedsAction = () => null;

export const iconMap = {
    [ACCEPTED]: IconYes,
    [DECLINED]: IconNo,
    [TENTATIVE]: IconMaybe,
    [DELEGATED]: () => null,
    [NEEDS_ACTION]: IconNeedsAction,
};

interface Props {
    partstat: ICAL_ATTENDEE_STATUS;
}
const ParticipantStatusIcon = ({ partstat }: Props) => {
    if (partstat === ACCEPTED) {
        return (
            <span className={`${iconContainerClassName} color-success`}>
                <Icon name="checkmark-circle-filled" className={iconClassName} size={16} />
            </span>
        );
    }
    if (partstat === TENTATIVE) {
        return (
            <span className={`${iconContainerClassName} color-warning`}>
                <Icon name="question-circle-filled" className={iconClassName} size={16} />
            </span>
        );
    }
    if (partstat === DECLINED) {
        return (
            <span className={`${iconContainerClassName} color-danger`}>
                <Icon name="cross-circle-filled" className={iconClassName} size={16} />
            </span>
        );
    }
    if (partstat === NEEDS_ACTION) {
        return null;
    }
    return null;
};

export default ParticipantStatusIcon;
