import { type Participant, Track } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { useIsWaitingRoomJoinEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/meetingInfo';
import { selectParticipantsWithDisabledVideos } from '@proton/meet/store/slices/settings';
import { selectIsWaitingRoomHost } from '@proton/meet/store/slices/waitingRoomSlice.ts';
import clsx from '@proton/utils/clsx';

import { useMediaManagementContext } from '../../../contexts/MediaManagementProvider/MediaManagementContext';
import { useCopyTextToClipboard } from '../../../hooks/useCopyTextToClipboard.ts';
import { EmptyList } from '../shared/EmptyList';
import { ParticipantListContainer } from '../shared/ParticipantListContainer';
import { AgentParticipantsList } from './AgentParticipantsList';
import { AllParticipantsItem } from './AllParticipantsItem';
import { useDebouncedActiveSpeakers } from './useDebouncedActiveSpeakers';
import { useHasMatchingAgents } from './useMatchingAgentIdentities';

type Props = {
    participants: Participant[];
    setIsScrolled: (isScrolled: boolean) => void;
    /** Already applied to `participants`; empty means no search is running. */
    searchExpression: string;
};

export const AllParticipantsTab = ({ participants, setIsScrolled, searchExpression }: Props) => {
    const isWaitingRoomJoinEnabled = useIsWaitingRoomJoinEnabled();

    const activeSpeakers = useDebouncedActiveSpeakers();
    const { toggleVideo, isVideoEnabled } = useMediaManagementContext();
    const copyTextToClipboard = useCopyTextToClipboard();

    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const meetingLink = useMeetSelector(selectMeetingLink);
    const isWaitingRoomHost = useMeetSelector(selectIsWaitingRoomHost) && isWaitingRoomJoinEnabled;

    const hasAgents = useHasMatchingAgents(searchExpression);

    const noResults = (
        <EmptyList
            icon={<IcMagnifier size={7} />}
            title={c('Title').t`No results found`}
            description={c('Description').t`Try a different name.`}
        />
    );

    return (
        <div className={clsx('flex flex-column flex-nowrap h-full relative', !isWaitingRoomHost && 'pt-4')}>
            {participants.length === 0 && !hasAgents ? (
                noResults
            ) : (
                <ParticipantListContainer
                    title={c('Title').t`Participants`}
                    setIsScrolled={setIsScrolled}
                    agentsList={hasAgents ? <AgentParticipantsList searchExpression={searchExpression} /> : undefined}
                    participantsList={
                        participants.length === 0 ? (
                            <li>{noResults}</li>
                        ) : (
                            participants.map((participant) => {
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
                                            toggleVideo={toggleVideo}
                                        />
                                    </li>
                                );
                            })
                        )
                    }
                />
            )}
            <div className="waiting-room-tab-footer absolute bottom-0 left-0 w-full p-4">
                <Button
                    className="secondary w-full rounded-full cursor-pointer px-8 py-3"
                    onClick={() => {
                        void copyTextToClipboard(meetingLink);
                    }}
                >
                    {c('Action').t`Copy invite link`}
                </Button>
            </div>
        </div>
    );
};
