import { type Participant, Track } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantsWithDisabledVideos } from '@proton/meet/store/slices/settings';

import { useMediaManagementContext } from '../../../contexts/MediaManagementProvider/MediaManagementContext';
import { useIsLocalParticipantAdmin } from '../../../hooks/useIsLocalParticipantAdmin';
import { EmptyList } from '../shared/EmptyList';
import { ParticipantListContainer } from '../shared/ParticipantListContainer';
import { AllParticipantsItem } from './AllParticipantsItem';
import { useDebouncedActiveSpeakers } from './useDebouncedActiveSpeakers';

type Props = {
    participants: Participant[];
    setIsScrolled: (isScrolled: boolean) => void;
};

export const AllParticipantsTab = ({ participants, setIsScrolled }: Props) => {
    const activeSpeakers = useDebouncedActiveSpeakers();
    const { toggleVideo, isVideoEnabled } = useMediaManagementContext();
    const { isLocalParticipantAdmin, isLocalParticipantHost } = useIsLocalParticipantAdmin();
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);

    return (
        <div className="flex flex-column flex-nowrap h-full relative pt-4">
            {participants.length === 0 ? (
                <EmptyList
                    icon={<IcMagnifier size={7} />}
                    title={c('Title').t`No results found`}
                    description={c('Description').t`Try a different name.`}
                />
            ) : (
                <ParticipantListContainer title={c('Title').t`Participants`} setIsScrolled={setIsScrolled}>
                    {participants.map((participant) => {
                        // We manage video and audio publication outside ParticipantListItem because livekit participant changes don't trigger
                        // a rerender on the consumers.
                        const videoPublication = Array.from(participant.trackPublications.values()).find(
                            (pub) => pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera
                        );
                        const audioPublication = Array.from(participant.trackPublications.values()).find(
                            (pub) => pub.kind === Track.Kind.Audio && pub.source === Track.Source.Microphone
                        );

                        return (
                            <li key={participant.identity}>
                                <AllParticipantsItem
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
                            </li>
                        );
                    })}
                </ParticipantListContainer>
            )}
            <div className="waiting-room-tab-footer absolute bottom-0 left-0 w-full p-4">
                <Button className="secondary w-full rounded-full px-8 py-3">
                    {c('Action').t`Copy invitation link`}
                </Button>
            </div>
        </div>
    );
};
