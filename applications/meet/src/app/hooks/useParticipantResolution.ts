import { useParticipants } from '@livekit/components-react';

import { useMeetContext } from '../contexts/MeetContext';
import { qualityConstants } from '../qualityConstants';
import { QualityScenarios } from '../types';

export const useParticipantResolution = () => {
    const participants = useParticipants();

    const { isScreenShare } = useMeetContext();

    if (isScreenShare) {
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
