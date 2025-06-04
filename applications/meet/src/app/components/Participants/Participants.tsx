import { useParticipants } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { IcMeetCamera, IcMeetCameraOff, IcMeetMicrophone, IcMeetMicrophoneOff } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useMeetContext } from '../../contexts/MeetContext';
import { useDebouncedActiveSpeakers } from '../../hooks/useDebouncedActiveSpeakers';
import { MeetingSideBars } from '../../types';

import './Participants.scss';

export const Participants = () => {
    const participants = useParticipants();

    const activeSpeakers = useDebouncedActiveSpeakers();

    const { sideBarState } = useMeetContext();

    if (!sideBarState[MeetingSideBars.Participants]) {
        return null;
    }

    return (
        <SideBar>
            <div className="absolute top-0 left-0 w-full px-4 pt-4 pb-0 bg-norm rounded-xl" style={{ opacity: 0.9 }}>
                <div className="mb-4 h3">
                    {c('Meet').t`Participants`} ({participants.length})
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 h-full participants-list">
                {participants.map((participant: Participant, index) => {
                    const videoPub = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera && pub.track
                    );

                    const audioPublication = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Audio && pub.track
                    );
                    const isMuted = !audioPublication || audioPublication.isMuted;

                    return (
                        <div
                            key={participant.identity}
                            className="flex gap-2 h-custom"
                            style={{ '--h-custom': 'fit-content', flexShrink: 0 }}
                        >
                            <div
                                className={clsx(
                                    `profile-background-${(index % 6) + 1}`,
                                    'color-invert rounded-full flex items-center justify-center w-custom h-custom'
                                )}
                                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                            >
                                <div>{participant.name?.[0].toLocaleUpperCase()}</div>
                            </div>
                            <div className="flex items-center">{participant.name}</div>
                            <div className="flex flex-nowrap items-center ml-auto gap-4 pr-4">
                                {!!activeSpeakers.find((p) => p.identity === participant.identity) ? (
                                    <SpeakingIndicator size={32} iconSize={5} />
                                ) : (
                                    <>
                                        {isMuted ? (
                                            <IcMeetMicrophoneOff viewBox="0 0 24 24" />
                                        ) : (
                                            <IcMeetMicrophone viewBox="0 0 24 24" />
                                        )}
                                    </>
                                )}

                                {!!videoPub && !videoPub.isMuted ? (
                                    <IcMeetCamera viewBox="0 0 24 24" />
                                ) : (
                                    <IcMeetCameraOff viewBox="0 0 24 24" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </SideBar>
    );
};
