import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';

import type { CreateProcessorOptions, NoiseCancellationModel } from '../../types';
import { DEEPFILTERNET_SAMPLE_RATE, DeepFilterNetFilter, isDeepFilterNetSupported } from './processor';

export const createDeepFilterNetModel = ({
    isEnabled,
    isMobileEnabled,
    reportError,
}: {
    isEnabled: boolean;
    isMobileEnabled: boolean;
    reportError: ReportMeetError;
}): NoiseCancellationModel => ({
    id: 'deepfilternet',
    audioContextSampleRate: DEEPFILTERNET_SAMPLE_RATE,
    isSupported: () => isEnabled && isDeepFilterNetSupported(isMobileEnabled),
    isNative: false,
    createProcessor: ({ onDisabledForPerformance }: CreateProcessorOptions = {}) =>
        DeepFilterNetFilter({ reportError, onDisabledForPerformance }),
});
