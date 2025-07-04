import type { RefObject } from 'react';
import React from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

import { useMeetContext } from '../../contexts/MeetContext';
import { useDevices } from '../../hooks/useDevices';
import { useLocalParticipantResolution } from '../../hooks/useLocalParticipantResolution';
import { VideoSettingsDropdown } from './VideoSettingsDropdown';

interface VideoSettingsProps {
    anchorRef?: RefObject<HTMLButtonElement>;
}

export function VideoSettings({ anchorRef }: VideoSettingsProps) {
    const { cameras } = useDevices();
    const { localParticipant } = useLocalParticipant();

    const { videoDeviceId, setVideoDeviceId } = useMeetContext();

    const { resolution } = useLocalParticipantResolution();

    const handleCameraChange = async (deviceId: string) => {
        if (deviceId === videoDeviceId) {
            return;
        }

        setVideoDeviceId(deviceId);

        const videoTrackPub = Array.from(localParticipant.trackPublications.values()).find(
            (pub) => pub.kind === Track.Kind.Video && pub.videoTrack
        );
        if (videoTrackPub && videoTrackPub.videoTrack) {
            const [width, height] = resolution?.split('x').map(Number) || [640, 480];
            await videoTrackPub.videoTrack.restartTrack({
                deviceId,
                resolution: { width, height },
            });
        }
    };

    return (
        <VideoSettingsDropdown
            anchorRef={anchorRef}
            handleCameraChange={handleCameraChange}
            videoDeviceId={videoDeviceId}
            cameras={cameras}
        />
    );
}
