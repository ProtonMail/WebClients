import { buildMailTo } from '@proton/shared/lib/helpers/email';
import { Participant } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    participant: Participant;
    isOrganizer?: boolean;
}
const ExtraEventParticipant = ({ participant, isOrganizer = false }: Props) => {
    const { displayEmail, displayName } = participant;

    const emailRow =
        displayName !== displayEmail ? (
            <div>
                <span title={displayName}>{`${displayName} `}</span>
                <a href={buildMailTo(displayEmail)} title={displayEmail}>
                    {displayEmail}
                </a>
            </div>
        ) : (
            <div>
                <a href={buildMailTo(displayEmail)} title={displayEmail}>
                    {displayEmail}
                </a>
            </div>
        );

    if (isOrganizer) {
        return (
            <div className="flex flex-column">
                {emailRow}
                <div className="color-weak">Organizer</div>
            </div>
        );
    }

    return emailRow;
};

export default ExtraEventParticipant;
