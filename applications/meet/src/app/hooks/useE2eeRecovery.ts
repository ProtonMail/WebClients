import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { isMobile, isWebKit } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import {
    type AudioRecoveryAPI,
    E2eeRecoveryManager,
    getE2eeRecoveryTuning,
} from '../utils/e2eeRecovery/E2eeRecoveryManager';

/**
 * Wires the E2EE recovery coordinator into the React tree. Owns the tick
 * interval that detects broken video / audio cryptors and triggers per-track
 * recovery via the supplied {@link AudioRecoveryAPI}.
 *
 * Only active on mobile WebKit browsers, where the WebKit E2EE cryptor
 * pipeline is known to break under certain conditions.
 *
 * The {@link AudioRecoveryAPI} comes from the audio subscription manager
 * because the unsubscribe/subscribe dance must coordinate with that
 * manager's cache and event guards.
 */
export const useE2eeRecovery = (audioManager: AudioRecoveryAPI) => {
    const room = useRoomContext();
    const { reportMeetError } = useMeetErrorReporting();

    const isMobileWebKit = isWebKit() && isMobile();
    const recoveryDisabled = useFlag('MeetE2eeDisableRecovery') || !isMobileWebKit;

    // Enable more aggressive recovery tuning.
    const isAggressiveRecovery = useFlag('MeetE2eeRecoveryAggressive');

    useEffect(() => {
        const tuning = getE2eeRecoveryTuning(isAggressiveRecovery ? 'aggressive' : 'default');

        const e2eeRecoveryManager = new E2eeRecoveryManager({
            room,
            audioManager,
            reportError: reportMeetError,
            disabled: recoveryDisabled,
            tuning,
        });

        e2eeRecoveryManager.setup();

        return () => {
            e2eeRecoveryManager.cleanup();
        };
    }, [room, audioManager, recoveryDisabled, isAggressiveRecovery, reportMeetError]);
};
