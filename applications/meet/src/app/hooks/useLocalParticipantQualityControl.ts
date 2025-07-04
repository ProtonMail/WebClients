import { useEffect } from 'react';

import { useMeetContext } from '../contexts/MeetContext';
import { useCurrentScreenShare } from './useCurrentScreenShare';
import { useVideoToggle } from './useVideoToggle';

export const useLocalParticipantQualityControl = () => {
    const { isVideoEnabled, videoDeviceId } = useMeetContext();

    const toggleVideo = useVideoToggle();

    const { videoTrack } = useCurrentScreenShare();

    const isScreenShare = !!videoTrack;

    useEffect(() => {
        if (isVideoEnabled && videoDeviceId) {
            void toggleVideo({ isEnabled: true, videoDeviceId, forceUpdate: true });
        }
    }, [videoDeviceId, toggleVideo, isScreenShare]);
};
