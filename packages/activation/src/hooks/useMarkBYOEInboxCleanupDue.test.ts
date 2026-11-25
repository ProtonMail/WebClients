import { renderHook } from '@testing-library/react';
import { type Mock, type MockedFunction, vi } from 'vitest';

import { FeatureCode } from '@proton/features/interface';
import { mockUseFeature } from '@proton/features/testing/mockUseFeature';
import type useFeature from '@proton/features/useFeature';
import { useFlag } from '@proton/unleash/useFlag';

import useMarkBYOEInboxCleanupDue from './useMarkBYOEInboxCleanupDue';

vi.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: vi.fn(() => false),
}));
const mockUseFlag = useFlag as MockedFunction<typeof useFlag>;

describe('useMarkBYOEInboxCleanupDue', () => {
    let mockUpdateCleanup: Mock;
    let mockUpdateSpotlight: Mock;
    let mockedUseFeature: ReturnType<typeof mockUseFeature>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateCleanup = vi.fn().mockResolvedValue(undefined);
        mockUpdateSpotlight = vi.fn().mockResolvedValue(undefined);
        mockedUseFeature = mockUseFeature();
        mockedUseFeature.mockImplementation(
            (code) =>
                ({
                    feature: undefined,
                    loading: false,
                    get: vi.fn(),
                    update: code === FeatureCode.BYOEInboxCleanupSpotlight ? mockUpdateSpotlight : mockUpdateCleanup,
                    code,
                }) as unknown as ReturnType<typeof useFeature>
        );
        mockUseFlag.mockImplementation((flag) => flag === 'InboxBringYourOwnEmailCleanup');
    });

    it('marks the spotlight due as well as the cleanup when import is on', async () => {
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await result.current({ importEmails: true });

        expect(mockedUseFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
        expect(mockedUseFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupSpotlight, false);
        expect(mockUpdateCleanup).toHaveBeenCalledTimes(1);
        expect(mockUpdateCleanup).toHaveBeenCalledWith(true);
        expect(mockUpdateSpotlight).toHaveBeenCalledTimes(1);
        expect(mockUpdateSpotlight).toHaveBeenCalledWith(true);
    });

    it('marks neither when import is off', async () => {
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await result.current({ importEmails: false });

        expect(mockUpdateCleanup).not.toHaveBeenCalled();
        expect(mockUpdateSpotlight).not.toHaveBeenCalled();
    });

    it('marks neither when the cleanup is switched off', async () => {
        mockUseFlag.mockReturnValue(false);
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await result.current({ importEmails: true });

        expect(mockUpdateCleanup).not.toHaveBeenCalled();
        expect(mockUpdateSpotlight).not.toHaveBeenCalled();
    });

    it('still marks the cleanup when saving the spotlight fails', async () => {
        mockUpdateSpotlight.mockRejectedValue(new Error('Feature code not found'));
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await expect(result.current({ importEmails: true })).resolves.toBeUndefined();
        expect(mockUpdateCleanup).toHaveBeenCalledWith(true);
    });

    it('still marks the spotlight when saving the cleanup fails', async () => {
        mockUpdateCleanup.mockRejectedValue(new Error('Feature code not found'));
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await expect(result.current({ importEmails: true })).resolves.toBeUndefined();
        expect(mockUpdateSpotlight).toHaveBeenCalledWith(true);
    });

    it('resolves when both saves fail', async () => {
        mockUpdateCleanup.mockRejectedValue(new Error('Feature code not found'));
        mockUpdateSpotlight.mockRejectedValue(new Error('Feature code not found'));
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await expect(result.current({ importEmails: true })).resolves.toBeUndefined();
    });
});
