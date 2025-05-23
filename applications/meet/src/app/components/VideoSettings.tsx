import React from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { useMeetContext } from '../contexts/MeetContext';
import { useDevices } from '../hooks/useDevices';
import { useLocalParticipantResolution } from '../hooks/useLocalParticipantResolution';
import { DeviceSelect } from './DeviceSelect/DeviceSelect';

export function VideoSettings() {
    const { cameras } = useDevices();
    const { localParticipant } = useLocalParticipant();

    const { videoDeviceId, setVideoDeviceId } = useMeetContext();

    const { resolution } = useLocalParticipantResolution();

    const handleCameraChange = async (deviceId: string) => {
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
        <div onClick={(e) => e.stopPropagation()}>
            <div className="w-custom max-w-custom" style={{ '--w-custom': '20rem', '--max-w-custom': '20rem' }}>
                <DeviceSelect
                    value={videoDeviceId}
                    onValue={handleCameraChange}
                    icon="meet-camera"
                    title="Video"
                    options={cameras.map((camera) => ({
                        value: camera.deviceId,
                        label: camera.label || c('Meet').t`Camera`,
                    }))}
                />
            </div>
        </div>
    );
}
