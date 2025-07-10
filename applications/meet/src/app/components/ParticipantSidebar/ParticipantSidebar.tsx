import React, { useMemo, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcChevronLeft, IcChevronRight } from '@proton/icons';

import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useSortedParticipants } from '../../hooks/useSortedParticipants';
import { ParticipantTile } from '../ParticipantTile/ParticipantTile';

import './ParticipantSidebar.scss';

export const ParticipantSidebar = ({
    participantSideBarOpen,
    setParticipantSideBarOpen,
}: {
    participantSideBarOpen: boolean;
    setParticipantSideBarOpen: (open: boolean) => void;
}) => {
    const [isParticipantSidebarHovered, setIsParticipantSidebarHovered] = useState(false);

    const { localParticipant } = useLocalParticipant();
    const { sortedParticipants, pagedParticipants } = useSortedParticipants();

    const { selfView } = useMeetContext();

    const { sideBarState } = useUIStateContext();

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
        <div
            className="w-full h-full overflow-y-auto hide-scrollbar relative"
            onMouseEnter={() => setIsParticipantSidebarHovered(true)}
            onMouseLeave={() => setIsParticipantSidebarHovered(false)}
            style={{ overflow: participantSideBarOpen ? 'hidden' : 'visible' }}
        >
            {(isParticipantSidebarHovered || !participantSideBarOpen) && (
                <Button
                    className="participant-sidebar-button absolute top-custom right-0 shrink-0 min-w-custom min-h-custom max-w-custom max-h-custom bg-weak"
                    onClick={() => setParticipantSideBarOpen(!participantSideBarOpen)}
                    shape="outline"
                    size="small"
                    style={{
                        '--min-w-custom': '2.75rem',
                        '--min-h-custom': '2.75rem',
                        '--max-w-custom': '2.75rem',
                        '--max-h-custom': '2.75rem',
                        '--top-custom': '50%',
                        transform: 'translateY(-50%)',
                    }}
                    title={
                        participantSideBarOpen
                            ? c('l10n_nightly Action').t`Hide participants`
                            : c('l10n_nightly Action').t`Show participants`
                    }
                >
                    {participantSideBarOpen ? (
                        <IcChevronRight className="shrink-0" size={6} />
                    ) : (
                        <IcChevronLeft className="shrink-0" size={6} />
                    )}
                </Button>
            )}
            {columns === 1 && participantSideBarOpen && (
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
            {columns === 2 && participantSideBarOpen && (
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
