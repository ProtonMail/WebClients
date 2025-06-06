import { useSortedParticipants } from '../hooks/useSortedParticipants';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

export const ParticipantGrid = () => {
    const { pagedParticipants, sortedParticipants } = useSortedParticipants();

    const gridTemplateColumns = (participantCount: number) => {
        if (participantCount < 4) {
            return `repeat(${participantCount}, 1fr)`;
        }

        if (participantCount === 4) {
            return 'repeat(2, 1fr)';
        }

        return 'repeat(3, 1fr)';
    };

    const gridTemplateRows = (participantCount: number) => {
        if (participantCount < 4) {
            return '1fr';
        }

        return 'repeat(2, 1fr)';
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <div
                className="w-full h-full"
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplateColumns(sortedParticipants.length),
                    gridTemplateRows: gridTemplateRows(sortedParticipants.length),
                    gap: '0.6875rem',
                }}
            >
                {pagedParticipants.map((participant) => {
                    return <ParticipantTile key={participant.identity} participant={participant} />;
                })}
            </div>
        </div>
    );
};
