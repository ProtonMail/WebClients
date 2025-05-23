import { useParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { Icon } from '@proton/components';
import { IcMeetCamera, IcMeetCameraOff, IcMeetMicrophone } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useMeetContext } from '../../contexts/MeetContext';
import { useDebouncedActiveSpeakers } from '../../hooks/useDebouncedActiveSpeakers';

import './Participants.scss';

export const Participants = () => {
    const participants = useParticipants();

    const activeSpeakers = useDebouncedActiveSpeakers();

    const { isParticipantsOpen, setIsParticipantsOpen } = useMeetContext();

    if (!isParticipantsOpen) {
        return null;
    }

    return (
        <SideBar>
            <div className="flex justify-end w-full">
                <Icon className="cursor-pointer" name="cross" onClick={() => setIsParticipantsOpen(false)} size={6} />
            </div>
            <div className="mb-4 h3">
                {c('Meet').t`Participants`} ({participants.length})
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar w-full flex flex-column flex-nowrap gap-4 pt-6 h-full">
                {participants.map((participant, index) => {
                    // @ts-ignore
                    const videoPub = Array.from(participant.trackPublications.values()).find(
                        (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera && pub.track // track is attached
                    );

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
                                style={{ '--w-custom': '40px', '--h-custom': '40px' }}
                            >
                                <div>{participant.name?.[0].toLocaleUpperCase()}</div>
                            </div>
                            <div className="flex items-center">{participant.name}</div>
                            <div className="flex flex-nowrap items-center ml-auto gap-4">
                                {!!activeSpeakers.find((p) => p.identity === participant.identity) ? (
                                    <SpeakingIndicator size={32} iconSize={5} />
                                ) : (
                                    <IcMeetMicrophone viewBox="0 0 24 24" />
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
