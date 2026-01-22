import type { ReactNode } from 'react';

import { useParticipantAudioControls } from '../hooks/useParticipantAudioControls/useParticipantAudioControls';
import { CameraTrackSubscriptionManagerProvider } from './CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';

export const SubscriptionManagementProvider = ({ children }: { children: ReactNode }) => {
    useParticipantAudioControls();

    return <CameraTrackSubscriptionManagerProvider>{children}</CameraTrackSubscriptionManagerProvider>;
};
