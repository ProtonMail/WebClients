import { useState } from 'react';

import { useParticipants } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetEyeClosed } from '@proton/icons/icons/IcMeetEyeClosed';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    disableParticipantVideo,
    enableParticipantVideo,
    selectParticipantsWithDisabledVideos,
} from '@proton/meet/store/slices/settings';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useSortedParticipantsContext } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useDebouncedActiveSpeakers } from '../../hooks/useDebouncedActiveSpeakers';
import { useIsLocalParticipantAdmin } from '../../hooks/useIsLocalParticipantAdmin';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { ParticipantHostControls } from '../ParticipantHostControls/ParticipantHostControls';
import { SideBarSearch } from '../SideBarSearch/SideBarSearch';

import './Participants.scss';

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

export const Participants = () => {
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const [isScrolled, setIsScrolled] = useState(false);

    const { sortedParticipants } = useSortedParticipantsContext();

    const activeSpeakers = useDebouncedActiveSpeakers();

    const participants = useParticipants({
        updateOnlyOn,
    });

    const participantsMap = new Map(participants.map((participant) => [participant.identity, participant]));

    const updatedParticipantsWithSorting = sortedParticipants
        .map((participant) => participantsMap.get(participant.identity))
        .filter(isTruthy);

    const { participantNameMap, maxParticipants } = useMeetContext();
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const dispatch = useMeetDispatch();

    const sideBarState = useMeetSelector(selectSideBarState);

    const { toggleVideo, isVideoEnabled } = useMediaManagementContext();

    const lowerCaseSearchExpression = searchExpression.toLowerCase();

    const filteredParticipants =
        !isSearchOn || !searchExpression
            ? updatedParticipantsWithSorting
            : updatedParticipantsWithSorting.filter((participant) => {
                  return participantNameMap[participant.identity]?.toLowerCase().includes(lowerCaseSearchExpression);
              });

    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();

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
                {filteredParticipants.map((participant: Participant, index) => {
                    const videoPub = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera
                    );

                    const audioPublication = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Audio && pub.source === Track.Source.Microphone
                    );
                    const isMuted = !audioPublication || audioPublication.isMuted;

                    const name = participantNameMap[participant.identity] ?? c('Info').t`Loading...`;

                    const isParticipantVideoDisabled = participant.isLocal
                        ? !isVideoEnabled
                        : participantsWithDisabledVideos.includes(participant.identity);

                    const isSpeaking = activeSpeakers.has(participant.identity);

                    const remoteParticipantLabel = isParticipantVideoDisabled
                        ? c('Action').t`Receive video`
                        : c('Action').t`Stop receiving video`;

                    const localParticipantLabel = isVideoEnabled
                        ? c('Action').t`Disable camera`
                        : c('Action').t`Enable camera`;

                    return (
                        <div
                            key={participant.identity}
                            className="flex flex-nowrap gap-2 h-custom"
                            style={{ '--h-custom': 'fit-content', flexShrink: 0 }}
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
                            <div className="text-ellipsis my-auto flex-1" title={name}>
                                {name} {participant.isLocal ? c('Info').t`(You)` : null}
                            </div>
                            <div className="flex flex-nowrap items-center ml-auto gap-1 shrink-0">
                                <div
                                    className="flex items-center justify-center w-custom h-custom"
                                    style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                                >
                                    {isMuted ? (
                                        <IcMeetMicrophoneOff className="muted-media-stream" />
                                    ) : (
                                        <SpeakingIndicator participant={participant} size={32} stopped={!isSpeaking} />
                                    )}
                                </div>

                                {!!videoPub && (!videoPub.isMuted || participant.isLocal) ? (
                                    <Tooltip
                                        title={participant.isLocal ? localParticipantLabel : remoteParticipantLabel}
                                        tooltipClassName="participants-button-tooltip color-norm"
                                        originalPlacement="top-end"
                                    >
                                        <Button
                                            className="participant-list-button-base participant-list-button-background p-2 flex items-center justify-center rounded-full w-custom h-custom border-none"
                                            onClick={() => {
                                                if (participant.isLocal) {
                                                    void toggleVideo({
                                                        isEnabled: !isVideoEnabled,
                                                        preserveCache: true,
                                                    });
                                                    return;
                                                }

                                                if (isParticipantVideoDisabled) {
                                                    dispatch(enableParticipantVideo(participant.identity));
                                                } else {
                                                    dispatch(disableParticipantVideo(participant.identity));
                                                }
                                            }}
                                            aria-label={c('Action').t`Enable video`}
                                            aria-pressed={videoPub?.isEnabled}
                                            style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                                        >
                                            {isParticipantVideoDisabled ? <IcMeetEyeClosed /> : <IcMeetCamera />}
                                        </Button>
                                    </Tooltip>
                                ) : (
                                    <div
                                        className="flex items-center justify-center w-custom h-custom"
                                        style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                                    >
                                        <IcMeetCameraOff className="muted-media-stream" />
                                    </div>
                                )}

                                {isLocalParticipantAdmin || isLocalParticipantHost ? (
                                    <ParticipantHostControls
                                        participant={participant}
                                        isVideoEnabled={!!videoPub && videoPub.isEnabled && !videoPub.isMuted}
                                        isAudioEnabled={!isMuted && !audioPublication?.isMuted}
                                        isLocalParticipantAdmin={isLocalParticipantAdmin}
                                        isLocalParticipantHost={isLocalParticipantHost}
                                    />
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </SideBar>
    );
};
