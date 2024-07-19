import { c } from 'ttag';

import { buildMailTo } from '@proton/shared/lib/helpers/email';
import type { Participant } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

interface Props {
    participant: Participant;
    isOrganizer?: boolean;
}
const ExtraEventParticipant = ({ participant, isOrganizer = false }: Props) => {
    const { displayEmail, displayName } = participant;

    const displayText = displayName !== displayEmail ? `${displayName} <${displayEmail}>` : displayEmail;

    return (
        <div className={clsx(['text-ellipsis', isOrganizer && 'mb-1'])}>
            {isOrganizer && <span className="mr-1">{c('ICS widget label for event details').t`Organizer:`}</span>}
            <a href={buildMailTo(displayEmail)} title={displayText}>
                {displayText}
            </a>
        </div>
    );
};

export default ExtraEventParticipant;
