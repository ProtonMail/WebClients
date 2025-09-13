import { useMeetContext } from '../contexts/MeetContext';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../hooks/useIsNarrowHeight';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

export const ParticipantGrid = () => {
    const { pagedParticipants } = useMeetContext();

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const gridTemplateColumns = (participantCount: number) => {
        if (!isLargerThanMd && !isNarrowHeight) {
            if (participantCount === 1 || participantCount === 2) {
                return '1fr';
            }

            if (participantCount > 2) {
                return 'repeat(2, 1fr)';
            }
        }

        if (participantCount < 4) {
            return `repeat(${participantCount}, 1fr)`;
        }

        if (participantCount === 4) {
            return 'repeat(2, 1fr)';
        }

        if (participantCount > 4 && participantCount <= 6) {
            return 'repeat(3, 1fr)';
        }

        if (participantCount > 6 && participantCount <= 12) {
            return 'repeat(4, 1fr)';
        }

        return 'repeat(5, 1fr)';
    };

    const gridTemplateRows = (participantCount: number) => {
        if (!isLargerThanMd && !isNarrowHeight) {
            if (participantCount === 1) {
                return '1fr';
            }

            if (participantCount === 2) {
                return 'repeat(2, 1fr)';
            }

            if (participantCount > 2) {
                return 'repeat(3, 1fr)';
            }
        }

        if (participantCount < 4) {
            return '1fr';
        }

        if (participantCount >= 4 && participantCount <= 8) {
            return 'repeat(2, 1fr)';
        }

        return 'repeat(3, 1fr)';
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto h-full">
            <div
                className="w-full h-full"
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplateColumns(pagedParticipants.length),
                    gridTemplateRows: gridTemplateRows(pagedParticipants.length),
                    gap: '0.6875rem',
                }}
            >
                {pagedParticipants.map((participant) => {
                    return (
                        <ParticipantTile
                            key={participant.identity}
                            participant={participant}
                            viewSize={pagedParticipants.length > 6 ? 'medium' : 'large'}
                        />
                    );
                })}
            </div>
        </div>
    );
};
