import { useParticipants } from '@livekit/components-react';

import { qualityConstants } from '../qualityConstants';
import { QualityScenarios } from '../types';
import { useCurrentScreenShare } from './useCurrentScreenShare';
import { useQualityLevel } from './useQualityLevel';

export const useParticipantResolution = () => {
    const quality = useQualityLevel();

    const participants = useParticipants();

    const { videoTrack: screenShareVideoTrack } = useCurrentScreenShare();

    const isScreenShareActive = !!screenShareVideoTrack;

    if (isScreenShareActive) {
        return qualityConstants[QualityScenarios.ScreenShare][quality];
    }

    if (participants.length > 4) {
        return qualityConstants[QualityScenarios.LargeGrid][quality];
    }

    return qualityConstants[QualityScenarios.Default][quality];
};
