import type { ReactNode } from 'react';

import { useE2eeRecovery } from '../hooks/useE2eeRecovery';
import { useE2eeStatsDebugger } from '../hooks/useE2eeStatsDebugger';
import { useParticipantAudioControls } from '../hooks/useParticipantAudioControls/useParticipantAudioControls';
import { CameraTrackSubscriptionManagerProvider } from './CameraTrackSubscriptionCacheProvider/CameraTrackSubscriptionManagerProvider';

export const SubscriptionManagementProvider = ({ children }: { children: ReactNode }) => {
    const audioTrackSubscriptionManager = useParticipantAudioControls();
    useE2eeRecovery(audioTrackSubscriptionManager);
    useE2eeStatsDebugger();

    return <CameraTrackSubscriptionManagerProvider>{children}</CameraTrackSubscriptionManagerProvider>;
};
