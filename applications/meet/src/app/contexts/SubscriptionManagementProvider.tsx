import type { ReactNode } from 'react';

import { useParticipantAudioControls } from '../hooks/useParticipantAudioControls/useParticipantAudioControls';
import type { LiveKitLogCollector } from '../utils/liveKitLogCollector/LiveKitLogCollector';
import { CameraTrackSubscriptionManagerProvider } from './CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';

export const SubscriptionManagementProvider = ({
    children,
    logCollector,
}: {
    children: ReactNode;
    logCollector: LiveKitLogCollector;
}) => {
    useParticipantAudioControls(logCollector);

    return <CameraTrackSubscriptionManagerProvider>{children}</CameraTrackSubscriptionManagerProvider>;
};
