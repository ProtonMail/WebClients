import { useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { SideBarSearch } from '../SideBarSearch/SideBarSearch';

import './AssignHostSidebar.scss';

export const AssignHostSidebar = () => {
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const { localParticipant } = useLocalParticipant();

    const { participantNameMap, assignHost, participantsMap, participants } = useMeetContext();

    const [isScrolled, setIsScrolled] = useState(false);

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    const lowerCaseSearchExpression = searchExpression.toLowerCase();

    const filteredParticipants = participants.filter((participant) => {
        return (
            participant.identity !== localParticipant.identity &&
            !participantsMap[participant.identity]?.IsHost &&
            !participantsMap[participant.identity]?.IsAdmin &&
            (!isSearchOn ||
                !searchExpression ||
                participantNameMap[participant.identity]?.toLowerCase().includes(lowerCaseSearchExpression))
        );
    });

    const [selectedParticipantIdentity, setSelectedParticipantIdentity] = useState<string | null>(
        filteredParticipants[0]?.identity ?? null
    );

    if (!sideBarState[MeetingSideBars.AssignHost]) {
        return null;
    }

    const selectedParticipantName = selectedParticipantIdentity ? participantNameMap[selectedParticipantIdentity] : '';

    return (
        <SideBar onClose={() => toggleSideBarState(MeetingSideBars.AssignHost)} paddingClassName="px-2 py-4">
            <div className="assign-host-sidebar flex-1 w-full flex flex-column flex-nowrap gap-4 h-full">
                <div className="text-center flex flex-column gap-3 flex-nowrap mb-4 px-6">
                    <div className="text-4xl text-semibold">{c('Title').t`Assign a new host`}</div>
                    <div className="color-hint">{c('Info')
                        .t`Select a participant to assign as the new host before you go: `}</div>
                </div>
                <div className="overflow-hidden flex flex-column flex-1">
                    <div className="flex items-center shrink-0 mb-4 px-2">
                        {isSearchOn ? (
                            <SideBarSearch
                                searchExpression={searchExpression}
                                setSearchExpression={setSearchExpression}
                                setIsSearchOn={setIsSearchOn}
                                placeholder={c('Placeholder').t`Find...`}
                            />
                        ) : (
                            <div className="text-semibold flex items-center">
                                <div className="text-xl text-semibold">{c('Title')
                                    .t`Participants (${filteredParticipants.length})`}</div>
                                <Button
                                    className="search-open-button p-0 ml-4 flex items-center justify-center"
                                    shape="ghost"
                                    size="small"
                                    onClick={() => setIsSearchOn(!isSearchOn)}
                                    aria-label={c('Alt').t`Open participants search`}
                                >
                                    <IcMagnifier size={6} />
                                </Button>
                            </div>
                        )}
                    </div>
                    <div
                        className="overflow-y-auto w-full flex flex-column flex-nowrap gap-0 flex-1 pb-custom"
                        onScroll={(event) => {
                            setIsScrolled(event.currentTarget.scrollTop > 0);
                        }}
                        style={{ '--pb-custom': '5rem' }}
                    >
                        {filteredParticipants.map((participant: Participant, index) => {
                            const name = participantNameMap[participant.identity] ?? c('Info').t`Loading...`;

                            const isSelected = selectedParticipantIdentity === participant.identity;

                            return (
                                <button
                                    key={participant.identity}
                                    className={clsx(
                                        'participant-container flex flex-nowrap gap-2 h-custom p-3 meet-radius w-full shrink-0',
                                        isSelected && 'selected-participant-container'
                                    )}
                                    style={{
                                        '--h-custom': 'fit-content',
                                    }}
                                    onClick={() => setSelectedParticipantIdentity(participant.identity)}
                                    aria-pressed={isSelected}
                                >
                                    <div
                                        className={clsx(
                                            `meet-background-${(index % 6) + 1}`,
                                            `profile-color-${(index % 6) + 1}`,
                                            'rounded-full flex items-center justify-center w-custom h-custom shrink-0'
                                        )}
                                        style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                                    >
                                        <div>
                                            {participantNameMap[participant.identity] ? (
                                                getParticipantInitials(participantNameMap[participant.identity])
                                            ) : (
                                                <CircleLoader
                                                    className="color-primary w-custom h-custom"
                                                    style={{ '--w-custom': '1rem', '--h-custom': '1rem' }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-column justify-space-between">
                                        <div className="text-left text-ellipsis mb-auto flex-1" title={name}>
                                            {name}
                                        </div>
                                        {isSelected && (
                                            <div className="new-host-label text-semibold">{c('Info').t`New host`}</div>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <div
                                            className="flex items-center justify-center w-custom min-w-custom ml-auto my-auto mr-4"
                                            style={{ '--w-custom': '2rem', '--min-w-custom': '2rem' }}
                                        >
                                            <IcCheckmark className="checkmark-icon" size={6} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div
                    className={clsx(
                        'assign-button-container absolute bottom-0 left-0 w-full flex items-center justify-center p-4',
                        isScrolled && 'scrolled'
                    )}
                >
                    <Button
                        className="color-invert rounded-full w-full py-4 text-ellipsis"
                        disabled={!selectedParticipantIdentity}
                        onClick={() => selectedParticipantIdentity && assignHost(selectedParticipantIdentity)}
                        size="large"
                    >{c('Action').t`Assign ${selectedParticipantName} as host`}</Button>
                </div>
            </div>
        </SideBar>
    );
};
