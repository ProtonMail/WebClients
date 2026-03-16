import { useMemo } from 'react';

import { useActiveBreakpoint } from '@proton/components/index';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPagedIdentities } from '@proton/meet/store/slices/sortedParticipantsSlice';

import { useSortedPagedParticipants } from '../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../hooks/useIsNarrowHeight';
import { calculateGridLayout } from '../utils/calculateGridLayout';
import { ParticipantTile } from './ParticipantTile/ParticipantTile';

export const ParticipantGrid = () => {
    const pagedParticipantIdentities = useMeetSelector(selectPagedIdentities);

    const pagedParticipants = useSortedPagedParticipants();

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const { cols, rows } = useMemo(
        () => calculateGridLayout(pagedParticipantIdentities.length, !isLargerThanMd || isNarrowHeight),
        [pagedParticipantIdentities.length, isLargerThanMd, isNarrowHeight]
    );

    const gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const gridTemplateRows = `repeat(${rows}, 1fr)`;

    const { viewportWidth } = useActiveBreakpoint();

    const getViewSize = (numberOfParticipants: number) => {
        if (viewportWidth.xsmall) {
            return 'small';
        }
        if (viewportWidth['<=small']) {
            return 'medium';
        }

        if (numberOfParticipants > 6 || viewportWidth.medium) {
            return 'midLarge';
        }
        return 'large';
    };

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
                {pagedParticipants.map((participant) => {
                    return (
                        <ParticipantTile
                            key={participant.identity}
                            participant={participant}
                            viewSize={getViewSize(pagedParticipants.length)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
