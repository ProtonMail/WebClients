import { memo } from 'react';

import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetEyeClosed } from '@proton/icons/icons/IcMeetEyeClosed';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveReaction, selectParticipantHasRaisedHand } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectParticipantNameMap } from '@proton/meet/store/slices/meetingInfo';
import { selectIsParticipantRecording } from '@proton/meet/store/slices/recordingStatusSlice';
import { disableParticipantVideo, enableParticipantVideo } from '@proton/meet/store/slices/settings';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { SpeakingIndicator } from '../../atoms/SpeakingIndicator';
import { RAISE_HAND_EMOJI } from '../../constants';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import type { ToggleVideoType } from '../../types';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { ParticipantHostControls } from '../ParticipantHostControls/ParticipantHostControls';

interface ParticipantListItemProps {
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

    // Local participant props
    isLocalParticipantAdmin: boolean;
    isLocalParticipantHost: boolean;
    toggleVideo: ToggleVideoType;
}

export const ParticipantListItem = memo(
    ({
        participant,
        isSpeaking,
        isMuted,
        hasVideoPublication,
        isVideoDisabled,
        isLocalParticipantAdmin,
        isLocalParticipantHost,
        toggleVideo,
    }: ParticipantListItemProps) => {
        const isMeetMultipleRecordingEnabled = useFlag('MeetMultipleRecording');

        const participantNameMap = useMeetSelector(selectParticipantNameMap);
        const isParticipantRecording = useMeetSelector((state) =>
            selectIsParticipantRecording(state, participant.identity)
        );

        const dispatch = useMeetDispatch();

        const activeReactions = useMeetSelector((state) => selectActiveReaction(state, participant.identity));
        const isHandRaised = useMeetSelector((state) => selectParticipantHasRaisedHand(state, participant.identity));
        const displayEmoji = activeReactions || (isHandRaised ? RAISE_HAND_EMOJI : undefined);

        const displayName = participantNameMap[participant.identity] ?? c('Info').t`Loading...`;
        const {
            participantColors: { backgroundColor, profileTextColor },
        } = useParticipantDisplayColors(participant.identity);

        const getInitials = () => {
            return participantNameMap[participant.identity] ? (
                getParticipantInitials(participantNameMap[participant.identity])
            ) : (
                <CircleLoader
                    className="color-primary w-custom h-custom"
                    style={{ '--w-custom': '1rem', '--h-custom': '1rem' }}
                />
            );
        };

        const getLabel = () => {
            if (participant.isLocal) {
                return isVideoDisabled ? c('Action').t`Enable camera` : c('Action').t`Disable camera`;
            }

            return isVideoDisabled ? c('Action').t`Receive video` : c('Action').t`Stop receiving video`;
        };

        return (
            <div className="flex flex-nowrap gap-2 h-custom" style={{ '--h-custom': 'fit-content', flexShrink: 0 }}>
                <div
                    className={clsx(
                        backgroundColor,
                        profileTextColor,
                        'rounded-full flex items-center justify-center w-custom h-custom shrink-0'
                    )}
                    style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                >
                    <div>{getInitials()}</div>
                </div>
                <div className="flex flex-column justify-center">
                    <div className="text-ellipsis w-full" title={displayName}>
                        {displayName} {participant.isLocal ? c('Info').t`(You)` : null}
                    </div>
                    {isParticipantRecording && isMeetMultipleRecordingEnabled && (
                        <div className="text-sm color-hint w-full">{c('Info').t`Recording`}</div>
                    )}
                </div>

                <div className="flex flex-nowrap items-center ml-auto gap-1 shrink-0">
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
                                aria-label={c('Action').t`Enable video`}
                                aria-pressed={!isVideoDisabled}
                                style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                            >
                                {isVideoDisabled ? <IcMeetEyeClosed /> : <IcMeetCamera />}
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
                            isVideoEnabled={hasVideoPublication}
                            isAudioEnabled={!isMuted}
                            isLocalParticipantAdmin={isLocalParticipantAdmin}
                            isLocalParticipantHost={isLocalParticipantHost}
                        />
                    ) : null}
                </div>
            </div>
        );
    }
);

ParticipantListItem.displayName = 'ParticipantListItem';
