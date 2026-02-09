import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { SCREEN_SHARE_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetSettings } from '@proton/meet/store/slices/settings';
import clsx from '@proton/utils/clsx';

import { useSortedParticipantsContext } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
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

    const { pagedParticipants, pagedParticipantsWithoutSelfView } = useSortedParticipantsContext();

    const { selfView } = useMeetSelector(selectMeetSettings);

    const participants = selfView ? pagedParticipants : pagedParticipantsWithoutSelfView;

    return (
        <div
            className="h-full overflow-y-auto hide-scrollbar relative shrink-0"
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
                <div className={clsx('h-full flex items-start flex-column flex-nowrap')}>
                    {participants.map((participant) => {
                        return (
                            <div
                                key={participant.identity}
                                className="w-custom h-custom"
                                style={{
                                    aspectRatio: '16/9',
                                    width: 'auto',
                                    '--h-custom': `${(100 / SCREEN_SHARE_PAGE_SIZE).toFixed(2)}%`,
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
