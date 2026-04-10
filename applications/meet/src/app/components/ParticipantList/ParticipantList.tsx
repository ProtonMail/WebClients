import { useState } from 'react';

import { useParticipants } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectMaxParticipants, selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';
import { selectParticipantsWithDisabledVideos } from '@proton/meet/store/slices/settings';
import { selectSortedParticipantIdentities } from '@proton/meet/store/slices/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import isTruthy from '@proton/utils/isTruthy';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useDebouncedActiveSpeakers } from '../../hooks/useDebouncedActiveSpeakers';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { SideBarSearch } from '../SideBarSearch/SideBarSearch';
import { ParticipantListItem } from './ParticipantListItem';

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
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const [isScrolled, setIsScrolled] = useState(false);

    const sortedParticipantIdentities = useMeetSelector(selectSortedParticipantIdentities);

    const participants = useParticipants({
        updateOnlyOn,
    });

    const participantsMap = new Map(participants.map((participant) => [participant.identity, participant]));
    const activeSpeakers = useDebouncedActiveSpeakers();
    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();
    const { toggleVideo, isVideoEnabled } = useMediaManagementContext();

    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const updatedParticipantsWithSorting = sortedParticipantIdentities
        .map((identity) => participantsMap.get(identity))
        .filter(isTruthy);

    const participantDecryptedNameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    const maxParticipants = useMeetSelector(selectMaxParticipants);
    const dispatch = useMeetDispatch();

    const sideBarState = useMeetSelector(selectSideBarState);

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
            absoluteHeader={true}
            isScrolled={isScrolled}
            paddingClassName="py-4"
            header={
                <div className="flex items-center">
                    {isSearchOn ? (
                        <SideBarSearch
                            searchExpression={searchExpression}
                            setSearchExpression={setSearchExpression}
                            setIsSearchOn={setIsSearchOn}
                            placeholder={c('Placeholder').t`Find...`}
                        />
                    ) : (
                        <div className="text-semibold flex items-center flex-nowrap">
                            <div className="flex items-baseline gap-1 flex-nowrap">
                                <span className="text-semibold text-2xl text-ellipsis">{c('Title')
                                    .t`Participants`}</span>
                                <span className="text-semibold text-sm color-hint text-tabular-nums">
                                    {maxParticipants
                                        ? `(${participantsCount}/${maxParticipants})`
                                        : `(${participantsCount})`}
                                </span>
                            </div>

                            <Button
                                className="search-open-button p-0 ml-2 flex items-center justify-center shrink-0"
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
            }
        >
            <div
                className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 h-full participants-list px-4"
                onScroll={(event) => {
                    setIsScrolled(event.currentTarget.scrollTop > 0);
                }}
            >
                {filteredParticipants.map((participant: Participant) => {
                    // We manage video and audio publication outside ParticipantListItem because livekit participant changes don't trigger
                    // a rerender on the consumers.
                    const videoPublication = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera
                    );
                    const audioPublication = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Audio && pub.source === Track.Source.Microphone
                    );

                    return (
                        <ParticipantListItem
                            key={participant.identity}
                            participant={participant}
                            isSpeaking={activeSpeakers.has(participant.identity)}
                            isMuted={!audioPublication || audioPublication.isMuted}
                            hasVideoPublication={
                                !!videoPublication && (!videoPublication.isMuted || participant.isLocal)
                            }
                            isVideoDisabled={
                                participant.isLocal
                                    ? !isVideoEnabled
                                    : participantsWithDisabledVideos.includes(participant.identity)
                            }
                            isLocalParticipantAdmin={isLocalParticipantAdmin}
                            isLocalParticipantHost={isLocalParticipantHost}
                            toggleVideo={toggleVideo}
                        />
                    );
                })}
            </div>
        </SideBar>
    );
};
