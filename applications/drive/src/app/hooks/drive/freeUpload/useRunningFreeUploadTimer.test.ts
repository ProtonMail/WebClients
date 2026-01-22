import { act, renderHook } from '@testing-library/react-hooks';

import { sendErrorReport } from '../../../utils/errorHandling';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';
import { useIsFreeUploadInProgress } from './useIsFreeUploadInProgress';
import { useRunningFreeUploadTimer } from './useRunningFreeUploadTimer';

jest.mock('./useFreeUploadFeature');
jest.mock('./useFreeUploadApi');
jest.mock('./useIsFreeUploadInProgress');
jest.mock('../../../utils/errorHandling');
jest.mock('../../../modals/FreeUploadOverModal/useFreeUploadOverModal', () => ({
    useFreeUploadOverModal: jest.fn(() => [null, jest.fn()]),
}));
jest.mock('@proton/components/hooks/useErrorHandler', () => ({
    __esModule: true,
    default: jest.fn(() => jest.fn()),
}));

const mockUseFreeUploadFeature = jest.mocked(useFreeUploadFeature);
const mockUseFreeUploadApi = jest.mocked(useFreeUploadApi);
const mockUseIsFreeUploadInProgress = jest.mocked(useIsFreeUploadInProgress);
const mockSendErrorReport = jest.mocked(sendErrorReport);

describe('useRunningFreeUploadTimer - upper bound (10 minutes) check', () => {
    const mockCheckFreeUploadTimer = jest.fn();
    const mockShowErrorNotification = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset store to initial state
        useFreeUploadStore.setState({
            isFreeUploadInProgress: false,
            bigCounterVisible: false,
            secondsLeft: 10 * 60,
            targetTime: 0,
        });

        mockUseFreeUploadFeature.mockReturnValue(true);
        mockUseIsFreeUploadInProgress.mockReturnValue(false);

        mockUseFreeUploadApi.mockReturnValue({
            checkFreeUploadTimer: mockCheckFreeUploadTimer,
            startFreeUploadTimer: jest.fn(),
            checkOnboardingStatus: jest.fn(),
        } as any);

        jest.spyOn(require('@proton/components/hooks/useErrorHandler'), 'default').mockReturnValue(
            mockShowErrorNotification
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should successfully begin countdown when EndTime is within 10 minutes', async () => {
        const now = Date.now();
        const recentCreateTime = Math.floor((now - 30 * 60 * 1000) / 1000);
        const validEndTime = Math.floor((now + 9 * 60 * 1000) / 1000);

        mockCheckFreeUploadTimer.mockResolvedValue({ EndTime: validEndTime });

        await act(async () => {
            renderHook(() => useRunningFreeUploadTimer(recentCreateTime));
            await new Promise((resolve) => process.nextTick(resolve));
        });

        const storeState = useFreeUploadStore.getState();

        expect(mockCheckFreeUploadTimer).toHaveBeenCalledTimes(1);
        expect(storeState.isFreeUploadInProgress).toBe(true);
        expect(storeState.targetTime).toBe(validEndTime * 1000);
        expect(mockShowErrorNotification).not.toHaveBeenCalled();
        expect(mockSendErrorReport).not.toHaveBeenCalled();
    });

    it('should handle EndTime after 10 minutes and show error', async () => {
        const now = Date.now();
        const recentCreateTime = Math.floor((now - 30 * 60 * 1000) / 1000);
        const tooLateEndTime = Math.floor((now + 11 * 60 * 1000) / 1000);

        mockCheckFreeUploadTimer.mockResolvedValue({ EndTime: tooLateEndTime });

        await act(async () => {
            renderHook(() => useRunningFreeUploadTimer(recentCreateTime));
            await new Promise((resolve) => process.nextTick(resolve));
        });

        const storeState = useFreeUploadStore.getState();

        expect(mockCheckFreeUploadTimer).toHaveBeenCalledTimes(1);
        expect(mockShowErrorNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('free upload is not available'),
            })
        );
        expect(storeState.isFreeUploadInProgress).toBe(false);
        expect(storeState.targetTime).toBe(0);
        expect(mockSendErrorReport).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('free upload is not available'),
            })
        );
    });
});
