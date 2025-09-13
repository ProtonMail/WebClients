import { useState } from 'react';

import { useParticipants } from '@livekit/components-react';
import type { Participant } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { IcMagnifier, IcMeetCamera, IcMeetCameraOff, IcMeetMicrophone, IcMeetMicrophoneOff } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useDebouncedActiveSpeakers } from '../../hooks/useDebouncedActiveSpeakers';
import { MeetingSideBars } from '../../types';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { ParticipantHostControls } from '../ParticipantHostControls/ParticipantHostControls';
import { SideBarSearch } from '../SideBarSearch/SideBarSearch';

import './Participants.scss';

export const Participants = () => {
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const participants = useParticipants();

    const activeSpeakers = useDebouncedActiveSpeakers();

    const { participantNameMap, participantsWithDisabledVideos, setParticipantsWithDisabledVideos } = useMeetContext();

    const { sideBarState, toggleSideBarState } = useUIStateContext();

    const lowerCaseSearchExpression = searchExpression.toLowerCase();

    const filteredParticipants =
        !isSearchOn || !searchExpression
            ? participants
            : participants.filter((participant) => {
                  return participantNameMap[participant.identity]?.toLowerCase().includes(lowerCaseSearchExpression);
              });

    if (!sideBarState[MeetingSideBars.Participants]) {
        return null;
    }

    return (
        <SideBar
            onClose={() => toggleSideBarState(MeetingSideBars.Participants)}
            absoluteHeader={true}
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
                        <div className="text-semibold flex items-center">
                            <div className="text-3xl">{c('Title').t`Participants`}</div>
                            <div className="text-semibold text-3xl">({participants.length})</div>
                            <Button
                                className="search-open-button p-0 ml-2 flex items-center justify-center"
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
            <div className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 h-full participants-list">
                {filteredParticipants.map((participant: Participant, index) => {
                    const videoPub = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera && pub.track
                    );

                    const audioPublication = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Audio && pub.track
                    );
                    const isMuted = !audioPublication || audioPublication.isMuted;

                    const name = participantNameMap[participant.identity] ?? c('Info').t`Loading...`;

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
                                {name}
                            </div>
                            <div className="flex flex-nowrap items-center ml-auto gap-2 shrink-0">
                                {!!activeSpeakers.find((p) => p.identity === participant.identity) ? (
                                    <SpeakingIndicator participant={participant} size={32} />
                                ) : (
                                    <div className="p-2 flex items-center justify-center">
                                        {isMuted ? <IcMeetMicrophoneOff /> : <IcMeetMicrophone />}
                                    </div>
                                )}

                                <Button
                                    className="p-2 flex items-center justify-center rounded-full"
                                    shape="ghost"
                                    size="small"
                                    onClick={() => {
                                        if (participant.isLocal) {
                                            return;
                                        }

                                        if (participantsWithDisabledVideos.includes(participant.identity)) {
                                            setParticipantsWithDisabledVideos(
                                                participantsWithDisabledVideos.filter(
                                                    (id) => id !== participant.identity
                                                )
                                            );
                                        } else {
                                            setParticipantsWithDisabledVideos([
                                                ...participantsWithDisabledVideos,
                                                participant.identity,
                                            ]);
                                        }
                                    }}
                                    aria-label={c('Action').t`Enable video`}
                                    aria-pressed={videoPub?.isEnabled}
                                >
                                    {!!videoPub &&
                                    !videoPub.isMuted &&
                                    !participantsWithDisabledVideos.includes(participant.identity) ? (
                                        <IcMeetCamera />
                                    ) : (
                                        <IcMeetCameraOff />
                                    )}
                                </Button>
                                <ParticipantHostControls
                                    participant={participant}
                                    isVideoEnabled={!!videoPub}
                                    isAudioEnabled={!isMuted}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </SideBar>
    );
};
