import { classnames } from '@proton/components';
import { c } from 'ttag';
import { buildMailTo } from '@proton/shared/lib/helpers/email';
import { Participant } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    participant: Participant;
    isOrganizer?: boolean;
}
const ExtraEventParticipant = ({ participant, isOrganizer = false }: Props) => {
    const { displayEmail, displayName } = participant;

    const displayText = displayName !== displayEmail ? `${displayName} <${displayEmail}>` : displayEmail;
    const organizerText = c('ICS widget label for event details').t`Organizer`;

    return (
        <div className={classnames(['text-ellipsis', isOrganizer && 'mb0-25'])}>
            <a href={buildMailTo(displayEmail)} title={displayText}>
                {displayText}
            </a>
            {isOrganizer && (
                <div className="color-weak text-sm text-ellipsis" title={organizerText}>
                    {organizerText}
                </div>
            )}
        </div>
    );
};

export default ExtraEventParticipant;
