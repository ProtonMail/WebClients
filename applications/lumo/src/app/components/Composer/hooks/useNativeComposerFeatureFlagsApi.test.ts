import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useLumoAuthAction } from '../../../hooks/useLumoAuthAction';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useMaxModelAvailability } from '../../../hooks/useMaxModelAvailability';
import { useLumoPlan } from '../../../providers/LumoPlanProvider';
import {
    setNativeApertusModelEnabled,
    setNativeMaxModelAvailability,
} from '../../../remote/nativeComposerBridgeHelpers';
import { useRemainingLimits } from '../../../services/usageLimitsStore';
import { useNativeComposerFeatureFlagsApi } from './useNativeComposerFeatureFlagsApi';

vi.mock('../../../hooks/useLumoAuthAction');
vi.mock('../../../hooks/useLumoFlags');
vi.mock('../../../hooks/useMaxModelAvailability');
vi.mock('../../../providers/LumoPlanProvider');
vi.mock('../../../remote/nativeComposerBridgeHelpers');
vi.mock('../../../remote/nativeFeatureFlagsBridgeHelpers');
// Keep the real predicate — only the limits source is faked.
vi.mock('../../../services/usageLimitsStore', async () => ({
    ...(await vi.importActual('../../../services/usageLimitsStore')),
    useRemainingLimits: vi.fn(),
}));

const mockedUseLumoAuthAction = useLumoAuthAction as Mock;
const mockedUseLumoFlags = useLumoFlags as Mock;
const mockedUseMaxModelAvailability = useMaxModelAvailability as Mock;
const mockedUseLumoPlan = useLumoPlan as Mock;
const mockedUseRemainingLimits = useRemainingLimits as Mock;

describe('useNativeComposerFeatureFlagsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseLumoAuthAction.mockReturnValue({ isEnabled: false });
        mockedUseLumoFlags.mockReturnValue({
            nativeComposerImages: false,
            nativeComposerModelSelection: true,
            apertusModelAvailable: false,
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

    it('reports whether Apertus 15 is enabled', () => {
        mockedUseLumoFlags.mockReturnValue({
            nativeComposerImages: false,
            nativeComposerModelSelection: true,
            apertusModelAvailable: true,
        });
        mockedUseRemainingLimits.mockReturnValue(null);

        renderHook(() => useNativeComposerFeatureFlagsApi());

        expect(setNativeApertusModelEnabled).toHaveBeenLastCalledWith(true);
    });
});
