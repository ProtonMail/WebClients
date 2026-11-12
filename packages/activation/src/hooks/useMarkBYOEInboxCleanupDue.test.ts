import { renderHook } from '@testing-library/react-hooks';

import { FeatureCode } from '@proton/features/interface';
import { mockUseFeature } from '@proton/features/testing/mockUseFeature';
import { useFlag } from '@proton/unleash/useFlag';

import useMarkBYOEInboxCleanupDue from './useMarkBYOEInboxCleanupDue';

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(() => false),
}));
const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>;

describe('useMarkBYOEInboxCleanupDue', () => {
    let mockUpdate: jest.Mock;
    let mockedUseFeature: ReturnType<typeof mockUseFeature>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUpdate = jest.fn().mockResolvedValue(undefined);
        mockedUseFeature = mockUseFeature({ update: mockUpdate });
        mockUseFlag.mockImplementation((flag) => flag === 'InboxBringYourOwnEmailCleanup');
    });

    it('sets the cleanup feature code to true when the cleanup is on and emails are imported', async () => {
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await result.current({ importEmails: true });

        expect(mockedUseFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupModal, false);
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockUpdate).toHaveBeenCalledWith(true);
    });

    it("does nothing when emails aren't imported", async () => {
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await result.current({ importEmails: false });

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('does nothing when the cleanup switch is off', async () => {
        mockUseFlag.mockReturnValue(false);
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await result.current({ importEmails: true });

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('resolves without throwing when saving the feature code fails', async () => {
        mockUpdate.mockRejectedValue(new Error('Feature code not found'));
        const { result } = renderHook(() => useMarkBYOEInboxCleanupDue());

        await expect(result.current({ importEmails: true })).resolves.toBeUndefined();
        expect(mockUpdate).toHaveBeenCalledWith(true);
    });
});
