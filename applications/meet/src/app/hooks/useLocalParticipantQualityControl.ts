import { useEffect } from 'react';

import { useMeetContext } from '../contexts/MeetContext';
import { useParticipantResolution } from './useParticipantResolution';

export const useLocalParticipantQualityControl = () => {
    const { isVideoEnabled, videoDeviceId } = useMeetContext();

    const { isScreenShare, toggleVideo } = useMeetContext();

    const participantResolution = useParticipantResolution();

    useEffect(() => {
        if (isVideoEnabled && videoDeviceId) {
            void toggleVideo({ isEnabled: true, videoDeviceId, forceUpdate: true });
        }
    }, [videoDeviceId, isScreenShare, participantResolution]);
};
