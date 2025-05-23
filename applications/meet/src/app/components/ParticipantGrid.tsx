import React from 'react';

import { PAGE_DIMENSION } from '../constants';
import { useSortedParticipants } from '../hooks/useSortedParticipants';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

export const ParticipantGrid = () => {
    const { sortedParticipants, pagedParticipants } = useSortedParticipants();

    const gridTemplateColumns = (participantCount: number) => {
        if (participantCount < 4) {
            return `repeat(${participantCount}, 1fr)`;
        }

        if (participantCount === 4) {
            return 'repeat(2, 1fr)';
        }
        if (participantCount > 4) {
            return 'repeat(3, 1fr)';
        }

        return `repeat(${PAGE_DIMENSION}, 1fr)`;
    };

    const gridTemplateRows = (participantCount: number) => {
        if (participantCount === 1 || participantCount === 2 || participantCount === 3) {
            return '1fr';
        }
        if (participantCount > 3 && participantCount < 7) {
            return 'repeat(2, 1fr)';
        }
        if (participantCount >= 7) {
            return 'repeat(3, 1fr)';
        }

        return '1fr';
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <div
                className="w-full h-full"
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplateColumns(sortedParticipants.length),
                    gridTemplateRows: gridTemplateRows(sortedParticipants.length),
                    gap: '10px',
                }}
            >
                {pagedParticipants.map((participant, index) => {
                    return <ParticipantTile key={participant.identity} participant={participant} index={index} />;
                })}
            </div>
        </div>
    );
};
