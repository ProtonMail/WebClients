import React from 'react';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import { Tooltip, Icon } from 'react-components';
import { c } from 'ttag';

const { ACCEPTED, DECLINED, TENTATIVE, DELEGATED, NEEDS_ACTION } = ICAL_ATTENDEE_STATUS;

const iconContainerClassName = 'inline-flex rounded50 p0-25 mr1 ml0-25 partstatIcon';
const iconClassName = 'mauto color-global-light';

const IconYes = ({ participantName }: { participantName: string }) => (
    <Tooltip title={c('Calendar invite info').t`${participantName} accepted your invitation`}>
        <span className={`${iconContainerClassName} bg-global-success`}>
            <Icon name="on" className={iconClassName} size={8} />
        </span>
    </Tooltip>
);
const IconMaybe = ({ participantName }: { participantName: string }) => (
    <Tooltip title={c('Calendar invite info').t`${participantName} tentatively accepted your invitation`}>
        <span className={`${iconContainerClassName} bg-global-attention`}>
            <Icon name="question-nocircle" className={iconClassName} size={8} />
        </span>
    </Tooltip>
);
const IconNo = ({ participantName }: { participantName: string }) => (
    <Tooltip title={c('Calendar invite info').t`${participantName} declined your invitation`}>
        <span className={`${iconContainerClassName} bg-global-warning`}>
            <Icon name="off" className={iconClassName} size={8} />
        </span>
    </Tooltip>
);
const IconNeedsAction = ({ participantName }: { participantName: string }) => (
    <Tooltip title={c('Calendar invite info').t`${participantName} hasn't answered your invitation yet`}>
        <span className={`${iconContainerClassName} needsAction`}>
            <Icon name="" size={8} />
        </span>
    </Tooltip>
);

export const iconMap = {
    [ACCEPTED]: IconYes,
    [DECLINED]: IconNo,
    [TENTATIVE]: IconMaybe,
    [DELEGATED]: () => null,
    [NEEDS_ACTION]: IconNeedsAction,
};

interface Props {
    name: string;
    partstat: ICAL_ATTENDEE_STATUS;
}
const ParticipantStatusIcon = ({ name, partstat }: Props) => {
    if (partstat === ACCEPTED) {
        return (
            <Tooltip title={c('Calendar invite info').t`${name} accepted the invitation`}>
                <span className={`${iconContainerClassName} bg-global-success`}>
                    <Icon name="on" className={iconClassName} size={8} />
                </span>
            </Tooltip>
        );
    }
    if (partstat === TENTATIVE) {
        return (
            <Tooltip title={c('Calendar invite info').t`${name} tentatively accepted the invitation`}>
                <span className={`${iconContainerClassName} bg-global-attention`}>
                    <Icon name="question-nocircle" className={iconClassName} size={8} />
                </span>
            </Tooltip>
        );
    }
    if (partstat === DECLINED) {
        return (
            <Tooltip title={c('Calendar invite info').t`${name} declined the invitation`}>
                <span className={`${iconContainerClassName} bg-global-warning`}>
                    <Icon name="off" className={iconClassName} size={8} />
                </span>
            </Tooltip>
        );
    }
    if (partstat === NEEDS_ACTION) {
        return (
            <Tooltip title={c('Calendar invite info').t`${name} hasn't answered the invitation yet`}>
                <span className={`${iconContainerClassName} needsAction`}>
                    <Icon name="" size={8} />
                </span>
            </Tooltip>
        );
    }
    return null;
};

export default ParticipantStatusIcon;
