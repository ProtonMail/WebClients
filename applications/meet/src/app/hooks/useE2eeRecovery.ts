import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { useMeetErrorReporting } from '@proton/meet';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import {
    type AudioRecoveryAPI,
    E2eeRecoveryManager,
    getE2eeRecoveryTuning,
} from '../utils/e2eeRecovery/E2eeRecoveryManager';

/**
 * Wires the E2EE recovery coordinator into the React tree. Owns the 2s
 * tick that detects broken video / audio cryptors and triggers per-track
 * recovery via the supplied {@link AudioRecoveryAPI}.
 *
 * This is expected only in safari based browsers.
 *
 * The {@link AudioRecoveryAPI} comes from the audio subscription manager
 * because the unsubscribe/subscribe dance must coordinate with that
 * manager's cache and event guards.
 */
export const useE2eeRecovery = (audioManager: AudioRecoveryAPI) => {
    const room = useRoomContext();
    const { reportMeetError } = useMeetErrorReporting();

    // Kill switch for the whole E2EE recovery manager (audio + video detectors and
    // the recoverTrack pipeline). Recovery is only meaningful in Safari based browsers, where the
    // cryptor pipeline is brittle. So it's always disabled for the rest of the browsers.
    const recoveryDisabled = useFlag('MeetE2eeDisableRecovery') || !isSafari();

    // Enable persistent noise detection needed for recovery when only audio is affected.
    const persistentNoiseDetectionEnabled = useFlag('MeetE2eeAudioNoiseDetection');

    // Enable more aggressive recovery tuning.
    const isAggressiveRecovery = useFlag('MeetE2eeRecoveryAggressive');

    useEffect(() => {
        const tuning = getE2eeRecoveryTuning(isAggressiveRecovery ? 'aggressive' : 'default');

        const e2eeRecoveryManager = new E2eeRecoveryManager({
            room,
            audioManager,
            reportError: reportMeetError,
            disabled: recoveryDisabled,
            persistentNoiseDetectionEnabled,
            tuning,
        });

        e2eeRecoveryManager.setup();

        return () => {
            e2eeRecoveryManager.cleanup();
        };
    }, [room, audioManager, recoveryDisabled, persistentNoiseDetectionEnabled, isAggressiveRecovery, reportMeetError]);
};
