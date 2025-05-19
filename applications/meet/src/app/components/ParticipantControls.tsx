import { useLocalParticipant } from '@livekit/components-react';
import type { VideoQuality } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { QualitySelector } from './QualitySelector';

interface ParticipantControlsProps {
    quality: VideoQuality;
    onQualityChange: (quality: VideoQuality) => void;
}

export const ParticipantControls = ({ quality, onQualityChange }: ParticipantControlsProps) => {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled)}>
                {isMicrophoneEnabled ? c('Meet').t`Mute` : c('Meet').t`Unmute`}
            </Button>
            <Button onClick={() => localParticipant?.setCameraEnabled(!isCameraEnabled)}>
                {isCameraEnabled ? c('Meet').t`Disable Video` : c('Meet').t`Enable Video`}
            </Button>
            <Button onClick={() => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled)}>
                {isScreenShareEnabled ? c('Meet').t`Stop Screen Share` : c('Meet').t`Share Screen`}
            </Button>
            <QualitySelector value={quality} onChange={onQualityChange} />
        </div>
    );
};
