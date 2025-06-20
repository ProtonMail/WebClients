import { useMemo, useState } from 'react';

import { useParticipants } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { IcMagnifier, IcMeetCamera, IcMeetCameraOff, IcMeetMicrophone, IcMeetMicrophoneOff } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { useMeetContext } from '../../contexts/MeetContext';
import { useDebouncedActiveSpeakers } from '../../hooks/useDebouncedActiveSpeakers';
import { MeetingSideBars } from '../../types';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { SideBarSearch } from '../SideBarSearch';

import './Participants.scss';

export const Participants = () => {
    const [isSearchOn, setIsSearchOn] = useState(false);
    const [searchExpression, setSearchExpression] = useState('');

    const participants = useParticipants();

    const activeSpeakers = useDebouncedActiveSpeakers();

    const { sideBarState } = useMeetContext();

    const { participantNameMap } = useMeetContext();

    const filteredParticipants = useMemo(() => {
        if (!isSearchOn || !searchExpression) {
            return participants;
        }

        return participants.filter((participant) => {
            return participantNameMap[participant.identity]?.toLowerCase().includes(searchExpression.toLowerCase());
        });
    }, [isSearchOn, searchExpression, participants]);

    if (!sideBarState[MeetingSideBars.Participants]) {
        return null;
    }

    return (
        <SideBar>
            <div className="absolute top-0 left-0 w-full px-4 pt-4 pb-0 bg-norm rounded-xl" style={{ opacity: 0.9 }}>
                {isSearchOn ? (
                    <SideBarSearch
                        searchExpression={searchExpression}
                        setSearchExpression={setSearchExpression}
                        setIsSearchOn={setIsSearchOn}
                        placeholder={c('l10n_nightly Placeholder').t`Search participants`}
                    />
                ) : (
                    <div className="mb-4 h3 text-semibold flex items-center">
                        {c('l10n_nightly Title').t`Participants`} ({participants.length})
                        <Button
                            className="p-0 ml-2 flex items-center justify-center"
                            shape="ghost"
                            size="small"
                            onClick={() => setIsSearchOn(!isSearchOn)}
                            aria-label={c('l10n_nightly Alt').t`Open participants search`}
                        >
                            <IcMagnifier size={6} />
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto w-full flex flex-column flex-nowrap gap-4 h-full participants-list">
                {filteredParticipants.map((participant: Participant, index) => {
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
                            <div className="flex items-center">
                                {participantNameMap[participant.identity] ?? c('l10n_nightly Info').t`Loading...`}
                            </div>
                            <div className="flex flex-nowrap items-center ml-auto gap-4 pr-4">
                                {!!activeSpeakers.find((p) => p.identity === participant.identity) ? (
                                    <SpeakingIndicator participant={participant} size={32} />
                                ) : (
                                    <>{isMuted ? <IcMeetMicrophoneOff /> : <IcMeetMicrophone />}</>
                                )}

                                {!!videoPub && !videoPub.isMuted ? <IcMeetCamera /> : <IcMeetCameraOff />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </SideBar>
    );
};
