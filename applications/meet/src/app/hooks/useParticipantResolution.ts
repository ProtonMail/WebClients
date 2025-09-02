import { useParticipants } from '@livekit/components-react';

import { qualityConstants } from '../qualityConstants';
import { QualityScenarios } from '../types';
import { useCurrentScreenShare } from './useCurrentScreenShare';

export const useParticipantResolution = () => {
    const participants = useParticipants();

    const { videoTrack: screenShareVideoTrack } = useCurrentScreenShare();

    const isScreenShareActive = !!screenShareVideoTrack;

    if (isScreenShareActive) {
        return qualityConstants[QualityScenarios.ScreenShare];
    }

    if (participants.length <= 3) {
        return qualityConstants[QualityScenarios.PortraitView];
    }

    if (participants.length > 8) {
        return qualityConstants[QualityScenarios.SmallView];
    }

    return qualityConstants[QualityScenarios.MediumView];
};
