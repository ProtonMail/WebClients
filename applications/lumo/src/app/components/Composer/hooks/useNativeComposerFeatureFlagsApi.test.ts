import { renderHook } from '@testing-library/react';

import { useLumoAuthAction } from '../../../hooks/useLumoAuthAction';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useMaxModelAvailability } from '../../../hooks/useMaxModelAvailability';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import { setNativeMaxModelAvailability } from '../../../remote/nativeComposerBridgeHelpers';
import { useRemainingLimits } from '../../../services/usageLimitsStore';
import { useNativeComposerFeatureFlagsApi } from './useNativeComposerFeatureFlagsApi';

jest.mock('../../../hooks/useLumoAuthAction');
jest.mock('../../../hooks/useLumoFlags');
jest.mock('../../../hooks/useMaxModelAvailability');
jest.mock('../../../providers/LumoPlanProvider');
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../remote/nativeFeatureFlagsBridgeHelpers');
// Keep the real predicate — only the limits source is faked.
jest.mock('../../../services/usageLimitsStore', () => ({
    ...jest.requireActual('../../../services/usageLimitsStore'),
    useRemainingLimits: jest.fn(),
}));

const mockedUseLumoAuthAction = useLumoAuthAction as jest.Mock;
const mockedUseLumoFlags = useLumoFlags as jest.Mock;
const mockedUseMaxModelAvailability = useMaxModelAvailability as jest.Mock;
const mockedUseLumoPlan = useLumoPlan as jest.Mock;
const mockedUseRemainingLimits = useRemainingLimits as jest.Mock;

describe('useNativeComposerFeatureFlagsApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseLumoAuthAction.mockReturnValue({ isEnabled: false });
        mockedUseLumoFlags.mockReturnValue({
            nativeComposerImages: false,
            nativeComposerModelSelection: true,
        });
        mockedUseLumoPlan.mockReturnValue({ isLumoFree: false, isGuest: true });
        mockedUseMaxModelAvailability.mockReturnValue({ isMaxAvailableByFlag: true });
    });

    it('reports Max unavailable once its pool is exhausted, even with the flag on', () => {
        mockedUseRemainingLimits.mockReturnValue({ lite: 5, max: 0 });

        renderHook(() => useNativeComposerFeatureFlagsApi());

        expect(setNativeMaxModelAvailability).toHaveBeenLastCalledWith('unavailable_limit_reached');
    });

    it('reports Max available while quota remains', () => {
        mockedUseRemainingLimits.mockReturnValue({ lite: 5, max: 3 });

        renderHook(() => useNativeComposerFeatureFlagsApi());

        expect(setNativeMaxModelAvailability).toHaveBeenLastCalledWith('available');
    });

    it('reports Max unavailable when the high-load flag is off', () => {
        mockedUseMaxModelAvailability.mockReturnValue({ isMaxAvailableByFlag: false });
        mockedUseRemainingLimits.mockReturnValue({ lite: 5, max: 3 });

        renderHook(() => useNativeComposerFeatureFlagsApi());

        expect(setNativeMaxModelAvailability).toHaveBeenLastCalledWith('unavailable_high_load');
    });

    it('prefers the high-load reason when the quota is also spent', () => {
        mockedUseMaxModelAvailability.mockReturnValue({ isMaxAvailableByFlag: false });
        mockedUseRemainingLimits.mockReturnValue({ lite: 5, max: 0 });

        renderHook(() => useNativeComposerFeatureFlagsApi());

        expect(setNativeMaxModelAvailability).toHaveBeenLastCalledWith('unavailable_high_load');
    });

    it('fails open while limits are still unknown', () => {
        mockedUseRemainingLimits.mockReturnValue(null);

        renderHook(() => useNativeComposerFeatureFlagsApi());

        expect(setNativeMaxModelAvailability).toHaveBeenLastCalledWith('available');
    });
});
