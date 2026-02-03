import { useMemo } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetSettings } from '@proton/meet/store/slices/settings';

import { useMeetContext } from '../contexts/MeetContext';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../hooks/useIsNarrowHeight';
import { calculateGridLayout } from '../utils/calculateGridLayout';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

export const ParticipantGrid = () => {
    const { pagedParticipants, pagedParticipantsWithoutSelfView } = useMeetContext();

    const { selfView } = useMeetSelector(selectMeetSettings);

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const actualPagedParticipantCount = selfView ? pagedParticipants.length : pagedParticipantsWithoutSelfView.length;
    const { cols, rows } = useMemo(
        () => calculateGridLayout(actualPagedParticipantCount, !isLargerThanMd || isNarrowHeight),
        [actualPagedParticipantCount, isLargerThanMd, isNarrowHeight]
    );

    const gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const gridTemplateRows = `repeat(${rows}, 1fr)`;

    return (
        <div className="flex-1 min-h-0 overflow-y-auto h-full">
            <div
                className="w-full h-full"
                style={{
                    display: 'grid',
                    gridTemplateColumns,
                    gridTemplateRows,
                    gap: '0.6875rem',
                }}
            >
                {(selfView ? pagedParticipants : pagedParticipantsWithoutSelfView).map((participant) => {
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
