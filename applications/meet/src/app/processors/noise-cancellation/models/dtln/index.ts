import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import type { NoiseCancellationModel } from '../../types';
import { DTLNFilter, DTLN_AUDIO_CONTEXT_SAMPLE_RATE, isDTLNFilterSupported } from './processor';

const isBrowserSupported = isDTLNFilterSupported();

export const createDtlnModel = ({
    isDtlnPerfMonitorEnabled,
    reportError,
}: {
    isDtlnPerfMonitorEnabled: boolean;
    reportError: ReportMeetError;
}): NoiseCancellationModel => ({
    id: 'dtln',
    audioContextSampleRate: DTLN_AUDIO_CONTEXT_SAMPLE_RATE,
    isSupported: () => isBrowserSupported,
    isNative: false,
    createProcessor: () => DTLNFilter({ isDtlnPerfMonitorEnabled, reportError }),
});
