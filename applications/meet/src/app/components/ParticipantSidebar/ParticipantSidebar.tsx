import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcChevronLeft, IcChevronRight } from '@proton/icons';

import { useMeetContext } from '../../contexts/MeetContext';
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

    const { pagedParticipants } = useMeetContext();

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
                    title={participantSideBarOpen ? c('Action').t`Hide participants` : c('Action').t`Show participants`}
                >
                    {participantSideBarOpen ? (
                        <IcChevronRight className="shrink-0" size={6} />
                    ) : (
                        <IcChevronLeft className="shrink-0" size={6} />
                    )}
                </Button>
            )}
            {participantSideBarOpen && (
                <div className="h-full flex items-start flex-column">
                    {pagedParticipants.map((participant) => {
                        return (
                            <div
                                key={participant.identity}
                                className="w-custom h-custom"
                                style={{
                                    aspectRatio: '16/9',
                                    width: 'auto',
                                    '--h-custom': '16.66%',
                                    boxSizing: 'border-box',
                                    padding: '0.125rem',
                                    breakInside: 'avoid',
                                }}
                            >
                                <ParticipantTile participant={participant} viewSize="small" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
