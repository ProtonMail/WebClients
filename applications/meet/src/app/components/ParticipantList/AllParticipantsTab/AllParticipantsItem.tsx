import { memo } from 'react';

import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetEyeClosed } from '@proton/icons/icons/IcMeetEyeClosed';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveReaction, selectParticipantHasRaisedHand } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    selectIsLocalParticipantAdminOrHost,
    selectParticipantName,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { disableParticipantVideo, enableParticipantVideo } from '@proton/meet/store/slices/settings';

import { SpeakingIndicator } from '../../../atoms/SpeakingIndicator';
import { RAISE_HAND_EMOJI } from '../../../constants';
import type { ToggleVideoType } from '../../../types';
import { ParticipantHostControls } from '../../ParticipantHostControls/ParticipantHostControls';
import { ParticipantNameWithInitials } from '../shared/ParticipantNameWithInitials';
import { AllParticipantsItemStatus } from './AllParticipantsItemStatus';

interface AllParticipantsItemProps {
    // Livekit participant
    participant: Participant;
    // True when participant is speaking
    isSpeaking: boolean;
    // True when participant is muted
    isMuted: boolean;
    // True if participant has video on
    hasVideoPublication: boolean;
    // True if local participant disabled video of this participant
    isVideoDisabled: boolean;
    toggleVideo: ToggleVideoType;
}

export const AllParticipantsItem = memo(
    ({
        participant,
        isSpeaking,
        isMuted,
        hasVideoPublication,
        isVideoDisabled,
        toggleVideo,
    }: AllParticipantsItemProps) => {
        const participantName = useMeetSelector((state) => selectParticipantName(state, participant.identity));

        const dispatch = useMeetDispatch();

        const isLocalParticipantAdminOrHost = useMeetSelector(selectIsLocalParticipantAdminOrHost);
        const activeReactions = useMeetSelector((state) => selectActiveReaction(state, participant.identity));
        const isHandRaised = useMeetSelector((state) => selectParticipantHasRaisedHand(state, participant.identity));
        const displayEmoji = activeReactions || (isHandRaised ? RAISE_HAND_EMOJI : undefined);

        const getLabel = () => {
            if (participant.isLocal) {
                return isVideoDisabled ? c('Action').t`Enable camera` : c('Action').t`Disable camera`;
            }

            return isVideoDisabled ? c('Action').t`Receive video` : c('Action').t`Stop receiving video`;
        };

        const getVideoIcon = () => {
            if (isVideoDisabled) {
                return participant.isLocal ? <IcMeetCameraOff className="muted-media-stream" /> : <IcMeetEyeClosed />;
            }

            return <IcMeetCamera />;
        };

        return (
            <ParticipantNameWithInitials
                identity={participant.identity}
                isLocal={participant.isLocal}
                participantName={participantName}
                statusNode={<AllParticipantsItemStatus participantIdentity={participant.identity} />}
            >
                {displayEmoji && <span>{displayEmoji}</span>}

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

                {hasVideoPublication ? (
                    <Tooltip
                        title={getLabel()}
                        tooltipClassName="participants-button-tooltip color-norm"
                        originalPlacement="top-end"
                    >
                        <Button
                            className="participant-list-button-base participant-list-button-background p-2 flex items-center justify-center rounded-full w-custom h-custom border-none"
                            onClick={() => {
                                if (participant.isLocal) {
                                    void toggleVideo({
                                        isEnabled: isVideoDisabled,
                                        preserveCache: true,
                                    });
                                    return;
                                }

                                if (isVideoDisabled) {
                                    dispatch(enableParticipantVideo(participant.identity));
                                } else {
                                    dispatch(disableParticipantVideo(participant.identity));
                                }
                            }}
                            aria-label={getLabel()}
                            aria-pressed={!isVideoDisabled}
                            style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                        >
                            {getVideoIcon()}
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

                {isLocalParticipantAdminOrHost ? (
                    <ParticipantHostControls
                        participant={participant}
                        isVideoEnabled={hasVideoPublication}
                        isAudioEnabled={!isMuted}
                    />
                ) : null}
            </ParticipantNameWithInitials>
        );
    }
);

AllParticipantsItem.displayName = 'AllParticipantsItem';
