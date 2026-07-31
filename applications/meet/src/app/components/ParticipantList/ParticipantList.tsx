import { useState } from 'react';

import { useParticipants } from '@livekit/components-react';
import { clsx } from 'clsx';
import { RoomEvent } from 'livekit-client';
import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectSortedParticipantIdentities } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsWaitingRoomHost } from '@proton/meet/store/slices/waitingRoomSlice';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { AllParticipantsTab } from './AllParticipantsTab/AllParticipantsTab';
import { ParticipantListHeader } from './ParticipantListHeader';
import { ParticipantListHost } from './ParticipantListHost';

import './ParticipantList.scss';

const updateOnlyOn = [
    RoomEvent.ParticipantConnected,
    RoomEvent.ParticipantDisconnected,
    RoomEvent.ConnectionStateChanged,
    RoomEvent.RoomMetadataChanged,
    RoomEvent.ParticipantPermissionsChanged,
    RoomEvent.ParticipantMetadataChanged,
    RoomEvent.ParticipantNameChanged,
    RoomEvent.ParticipantAttributesChanged,
    RoomEvent.TrackMuted,
    RoomEvent.TrackUnmuted,
    RoomEvent.TrackPublished,
    RoomEvent.TrackUnpublished,
    RoomEvent.TrackSubscriptionFailed,
    RoomEvent.TrackSubscriptionPermissionChanged,
    RoomEvent.TrackSubscriptionStatusChanged,
    RoomEvent.LocalTrackPublished,
    RoomEvent.LocalTrackUnpublished,
];

export const ParticipantList = () => {
    const isMeetWaitingRoomEnabled = useFlag('MeetWaitingRoom');
    const dispatch = useMeetDispatch();

    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    const sortedParticipantIdentities = useMeetSelector(selectSortedParticipantIdentities);
    const sideBarState = useMeetSelector(selectSideBarState);
    const participantDecryptedNameMap = useMeetSelector(selectParticipantDecryptedNameMap);
    const isWaitingRoomHost = useMeetSelector(selectIsWaitingRoomHost) && isMeetWaitingRoomEnabled;

    const participants = useParticipants({
        updateOnlyOn,
    });

    const participantsMap = new Map(participants.map((participant) => [participant.identity, participant]));

    const updatedParticipantsWithSorting = sortedParticipantIdentities
        .map((identity) => participantsMap.get(identity))
        .filter(isTruthy);

    const lowerCaseSearchExpression = searchExpression.toLowerCase();

    const filteredParticipants =
        !isSearchOn || !searchExpression
            ? updatedParticipantsWithSorting
            : updatedParticipantsWithSorting.filter((participant) => {
                  return participantDecryptedNameMap[participant.identity]
                      ?.toLowerCase()
                      .includes(lowerCaseSearchExpression);
              });

    if (!sideBarState[MeetingSideBars.Participants]) {
        return null;
    }

    const participantsCount = updatedParticipantsWithSorting.length;

    return (
        <SideBar
            onClose={() => dispatch(toggleSideBarState(MeetingSideBars.Participants))}
            aria-label={c('Aria').t`Participants`}
            absoluteHeader={true}
            isScrolled={isScrolled}
            paddingHeaderClassName={clsx(!isWaitingRoomHost && 'side-bar-header-wrapper-no-nav')}
            paddingClassName="pt-4"
            header={
                <ParticipantListHeader
                    isSearchOn={isSearchOn}
                    searchExpression={searchExpression}
                    setSearchExpression={setSearchExpression}
                    setIsSearchOn={setIsSearchOn}
                    participantsCount={participantsCount}
                />
            }
        >
            <div className="participants-list-container h-full">
                {isWaitingRoomHost ? (
                    <ParticipantListHost
                        participants={filteredParticipants}
                        isSearchOn={isSearchOn}
                        searchExpression={searchExpression}
                        setIsScrolled={setIsScrolled}
                        participantsCount={participantsCount}
                    />
                ) : (
                    <AllParticipantsTab participants={filteredParticipants} setIsScrolled={setIsScrolled} />
                )}
            </div>
        </SideBar>
    );
};
