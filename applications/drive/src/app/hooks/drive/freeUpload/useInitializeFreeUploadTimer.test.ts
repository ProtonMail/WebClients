import { renderHook } from '@testing-library/react-hooks';

import { sendErrorReport } from '../../../utils/errorHandling';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';
import { useInitializeFreeUploadTimer } from './useInitializeFreeUploadTimer';

jest.mock('./useFreeUploadFeature');
jest.mock('./useFreeUploadApi');
jest.mock('../../../utils/errorHandling');
jest.mock('@proton/components/hooks/useErrorHandler', () => ({
    __esModule: true,
    default: jest.fn(() => jest.fn()),
}));

const mockUseFreeUploadFeature = jest.mocked(useFreeUploadFeature);
const mockUseFreeUploadApi = jest.mocked(useFreeUploadApi);
const mockSendErrorReport = jest.mocked(sendErrorReport);

describe('useInitializeFreeUploadTimer - initializeTimer function', () => {
    const mockStartFreeUploadTimer = jest.fn();
    const mockCheckOnboardingStatus = jest.fn();
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

        mockUseFreeUploadFeature.mockReturnValue(false);
        mockUseFreeUploadApi.mockReturnValue({
            startFreeUploadTimer: mockStartFreeUploadTimer,
            checkOnboardingStatus: mockCheckOnboardingStatus,
        } as any);

        jest.spyOn(require('@proton/components/hooks/useErrorHandler'), 'default').mockReturnValue(
            mockShowErrorNotification
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should successfully initialize timer when EndTime is correct (between 9 and 10 minutes)', async () => {
        const now = Date.now();
        const correctEndTime = Math.floor((now + 9.5 * 60 * 1000) / 1000);

        mockStartFreeUploadTimer.mockResolvedValue({ EndTime: correctEndTime });

        const { result } = renderHook(() => useInitializeFreeUploadTimer());

        await result.current.initializeTimer();

        const storeState = useFreeUploadStore.getState();

        expect(mockStartFreeUploadTimer).toHaveBeenCalledTimes(1);
        expect(storeState.isFreeUploadInProgress).toBe(true);
        expect(storeState.targetTime).toBe(correctEndTime * 1000);
        expect(mockShowErrorNotification).not.toHaveBeenCalled();
        expect(mockSendErrorReport).not.toHaveBeenCalled();
    });

    it('should handle EndTime too late (after 10 minutes) and show error', async () => {
        const now = Date.now();
        const tooLateEndTime = Math.floor((now + 11 * 60 * 1000) / 1000);

        mockStartFreeUploadTimer.mockResolvedValue({ EndTime: tooLateEndTime });

        const { result } = renderHook(() => useInitializeFreeUploadTimer());

        await result.current.initializeTimer();

        const storeState = useFreeUploadStore.getState();

        expect(mockStartFreeUploadTimer).toHaveBeenCalledTimes(1);
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

    it('should handle EndTime too early (before 9 minutes) and show error', async () => {
        const now = Date.now();
        const tooEarlyEndTime = Math.floor((now + 8 * 60 * 1000) / 1000);

        mockStartFreeUploadTimer.mockResolvedValue({ EndTime: tooEarlyEndTime });

        const { result } = renderHook(() => useInitializeFreeUploadTimer());

        await result.current.initializeTimer();

        const storeState = useFreeUploadStore.getState();

        expect(mockStartFreeUploadTimer).toHaveBeenCalledTimes(1);
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
