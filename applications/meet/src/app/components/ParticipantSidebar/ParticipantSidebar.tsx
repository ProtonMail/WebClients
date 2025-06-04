import React, { useMemo } from 'react';

import { useLocalParticipant } from '@livekit/components-react';

import { useMeetContext } from '../../contexts/MeetContext';
import { useSortedParticipants } from '../../hooks/useSortedParticipants';
import { ParticipantTile } from '../ParticipantTile/ParticipantTile';

import './ParticipantSidebar.scss';

export const ParticipantSidebar = () => {
    const { localParticipant } = useLocalParticipant();
    const { sortedParticipants, pagedParticipants } = useSortedParticipants();

    const { sideBarState, selfView } = useMeetContext();

    const filteredParticipants = useMemo(
        () =>
            sortedParticipants.filter((participant) =>
                selfView ? true : sortedParticipants.length === 1 || participant.identity !== localParticipant.identity
            ),
        [sortedParticipants, selfView, localParticipant]
    );

    const sidebarOpen = Object.values(sideBarState).some((value) => value);

    const columns = filteredParticipants.length < 6 || sidebarOpen ? 1 : 2;

    return (
        <div className="w-full h-full overflow-y-auto hide-scrollbar">
            {columns === 1 && (
                <div className="w-full h-full flex items-start flex-column">
                    {pagedParticipants.map((participant) => {
                        return (
                            <div
                                key={participant.identity}
                                className="w-custom h-custom"
                                style={{
                                    '--w-custom': `${100 / columns}%`,
                                    '--h-custom': '33.33%',
                                    boxSizing: 'border-box',
                                    padding: '0.3125rem',
                                    breakInside: 'avoid',
                                }}
                            >
                                <ParticipantTile participant={participant} smallView={true} />
                            </div>
                        );
                    })}
                </div>
            )}
            {columns === 2 && (
                <div
                    className="w-full h-full"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gridTemplateRows: 'repeat(3, 1fr)',
                        gap: '0.3125rem',
                    }}
                >
                    {pagedParticipants.map((participant) => (
                        <ParticipantTile key={participant.identity} participant={participant} smallView={true} />
                    ))}
                </div>
            )}
        </div>
    );
};
