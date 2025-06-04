import { useCallback, useRef } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { LocalTrack, TrackPublishOptions, VideoCaptureOptions } from 'livekit-client';
import { Track } from 'livekit-client';

import isEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { useParticipantResolution } from './useParticipantResolution';

const increasedVideoQuality = process.env.LIVEKIT_INCREASED_VIDEO_QUALITY === 'true';

export const useVideoToggle = () => {
    const { localParticipant } = useLocalParticipant();
    const participantResolution = useParticipantResolution();

    const toggleQueue = useRef(Promise.resolve());

    const prevArguments =
        useRef<[enabled: boolean, options?: VideoCaptureOptions, publishOptions?: TrackPublishOptions]>(null);

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
                    ? { deviceId: { exact: videoDeviceId }, resolution: participantResolution.resolution }
                    : false;
                const videoPublishInfo = {
                    simulcast: increasedVideoQuality,
                    videoEncoding: participantResolution.encoding,
                };

                const video = isFaceTrackingEnabled ? false : videoInfo;

                const videoTrack = [...localParticipant.trackPublications.values()].find(
                    (item) => item.kind === Track.Kind.Video && item.source !== Track.Source.ScreenShare
                )?.track;

                const setCameraEnabledArguments = [
                    !!video,
                    typeof video !== 'boolean' ? video : undefined,
                    isEnabled ? videoPublishInfo : undefined,
                ];

                if (isEqual(setCameraEnabledArguments, prevArguments.current)) {
                    return;
                }

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

                // @ts-ignore
                prevArguments.current = setCameraEnabledArguments;
            });
            return toggleQueue.current;
        },
        [participantResolution]
    );

    return toggleVideo;
};
