import { c } from 'ttag';

import { classnames } from '@proton/components';
import { buildMailTo } from '@proton/shared/lib/helpers/email';
import { Participant } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    participant: Participant;
    isOrganizer?: boolean;
}
const ExtraEventParticipant = ({ participant, isOrganizer = false }: Props) => {
    const { displayEmail, displayName } = participant;

    const displayText = displayName !== displayEmail ? `${displayName} <${displayEmail}>` : displayEmail;

    return (
        <div className={classnames(['text-ellipsis', isOrganizer && 'mb0-25'])}>
            {isOrganizer && <span className="mr0-25">{c('ICS widget label for event details').t`Organizer:`}</span>}
            <a href={buildMailTo(displayEmail)} title={displayText}>
                {displayText}
            </a>
        </div>
    );
};

export default ExtraEventParticipant;
