import { useEffect, useRef } from 'react';

import { useLocalParticipant } from '@livekit/components-react';

import { useMediaManagementContext } from '../contexts/MediaManagementContext';
import { useMeetContext } from '../contexts/MeetContext';
import { useParticipantResolution } from './useParticipantResolution';

export const useLocalParticipantQualityControl = () => {
    const { isScreenShare } = useMeetContext();
    const { toggleVideo } = useMediaManagementContext();

    const participantResolution = useParticipantResolution();

    const { isCameraEnabled: isVideoEnabled } = useLocalParticipant();

    const hasInitialized = useRef(false);

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            return;
        }

        if (isVideoEnabled) {
            void toggleVideo({ isEnabled: true, forceUpdate: true });
        }
    }, [isScreenShare, participantResolution]);
};
