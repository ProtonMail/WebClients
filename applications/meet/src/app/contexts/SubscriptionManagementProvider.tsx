import type { ReactNode } from 'react';

import { useParticipantAudioControls } from '../hooks/useParticipantAudioControls/useParticipantAudioControls';
import { CameraTrackSubscriptionCacheProvider } from './CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionCacheProvider';

export const SubscriptionManagementProvider = ({ children }: { children: ReactNode }) => {
    useParticipantAudioControls();

    return <CameraTrackSubscriptionCacheProvider>{children}</CameraTrackSubscriptionCacheProvider>;
};
