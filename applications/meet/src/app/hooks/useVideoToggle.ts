import { useCallback, useRef } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { LocalTrack } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

import { useMeetContext } from '../contexts/MeetContext';
import { useParticipantResolution } from './useParticipantResolution';

const increasedVideoQuality = process.env.LIVEKIT_INCREASED_VIDEO_QUALITY === 'true';

export const useVideoToggle = () => {
    const { localParticipant } = useLocalParticipant();
    const participantResolution = useParticipantResolution();

    const { setIsVideoEnabled } = useMeetContext();

    const toggleQueue = useRef(Promise.resolve());

    const toggleVideo = useCallback(
        async ({
            isEnabled,
            videoDeviceId,
            isFaceTrackingEnabled = false,
            forceUpdate = false,
        }: {
            isEnabled: boolean;
            videoDeviceId: string;
            isFaceTrackingEnabled?: boolean;
            externalResolution?: string;
            forceUpdate?: boolean;
        }) => {
            toggleQueue.current = toggleQueue.current.then(async () => {
                const videoInfo = isEnabled
                    ? {
                          deviceId: { exact: videoDeviceId },
                          resolution: participantResolution.resolution,
                          facingMode: 'user' as const,
                      }
                    : false;
                const videoPublishInfo = {
                    simulcast: increasedVideoQuality,
                    videoEncoding: participantResolution.encoding,
                };

                const video = isFaceTrackingEnabled ? false : videoInfo;

                const videoTrack = [...localParticipant.trackPublications.values()].find(
                    (item) => item.kind === Track.Kind.Video && item.source !== Track.Source.ScreenShare
                )?.track;

                if (forceUpdate && isEnabled) {
                    await localParticipant.unpublishTrack(videoTrack as LocalTrack);

                    await localParticipant.setCameraEnabled(
                        !!video,
                        typeof video !== 'boolean' ? video : undefined,
                        isEnabled ? videoPublishInfo : undefined
                    );
                } else {
                    await localParticipant.setCameraEnabled(
                        !!video,
                        typeof video !== 'boolean' ? video : undefined,
                        isEnabled ? videoPublishInfo : undefined
                    );

                    if (!isEnabled) {
                        await localParticipant.unpublishTrack(videoTrack as LocalTrack);
                    }
                }

                setIsVideoEnabled(isEnabled);
            });
            return toggleQueue.current;
        },
        [participantResolution, setIsVideoEnabled]
    );

    return toggleVideo;
};
