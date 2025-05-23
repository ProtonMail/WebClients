import React from 'react';

import clsx from '@proton/utils/clsx';

import { useMeetContext } from '../../contexts/MeetContext';
import { useSortedParticipants } from '../../hooks/useSortedParticipants';
import { ParticipantTile } from '../ParticipantTile/ParticipantTile';

import './ParticipantSidebar.scss';

export const ParticipantSidebar = () => {
    const { sortedParticipants } = useSortedParticipants();

    const { isParticipantsOpen } = useMeetContext();

    const columns = sortedParticipants.length < 6 || isParticipantsOpen ? 1 : 2;

    return (
        <div className="w-full h-full overflow-y-auto hide-scrollbar">
            <div className={clsx('w-full h-full flex items-start', sortedParticipants.length < 4 && 'flex-column')}>
                {sortedParticipants.map((participant, index) => {
                    return (
                        <div
                            key={participant.identity}
                            className="w-custom h-custom"
                            style={{
                                '--w-custom': `${100 / columns}%`,
                                '--h-custom': '33.33%',
                                boxSizing: 'border-box',
                                padding: '0.3125rem',
                            }}
                        >
                            <ParticipantTile participant={participant} index={index} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
