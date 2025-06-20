import type { LocalVideoTrack } from 'livekit-client';

import { useChat } from './useChat';
import { useE2EE } from './useE2EE';
import { useFaceTrackingPublisher } from './useFaceTrackingPublisher';
import { useLocalParticipantQualityControl } from './useLocalParticipantQualityControl';
import { useMediaDeviceSetup } from './useMediaDeviceSetup';
import { usePaginationSizeUpdates } from './usePaginationSizeUpdates';
import { useParticipantEvents } from './useParticipantEvents';
import { useParticipantNameMapUpdate } from './useParticipantNameMapUpdate';
import { usePublicationQualityControls } from './usePublicationQualityControls';
import { useResolutionInitialisation } from './useResolutionInitialisation';
import { useScreenShareUpdates } from './useScreenShareUpdates';

export const useMeetingInitialisation = ({
    faceTrack,
    isFaceTrackingEnabled,
}: {
    faceTrack: LocalVideoTrack | null;
    isFaceTrackingEnabled: boolean;
}) => {
    useE2EE();
    useFaceTrackingPublisher({ faceTrack, isFaceTrackingEnabled });
    usePublicationQualityControls();
    useResolutionInitialisation();
    useParticipantEvents();
    useChat();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useLocalParticipantQualityControl();
    useMediaDeviceSetup();
    useParticipantNameMapUpdate();
};
