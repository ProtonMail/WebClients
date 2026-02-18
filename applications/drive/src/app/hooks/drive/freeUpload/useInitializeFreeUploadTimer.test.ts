import { renderHook } from '@testing-library/react-hooks';

import { sendErrorReport } from '../../../utils/errorHandling';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';
import { useInitializeFreeUploadTimer } from './useInitializeFreeUploadTimer';

jest.mock('./useFreeUploadFeature');
jest.mock('./useFreeUploadApi');
jest.mock('../../../utils/errorHandling');

const mockCreateNotification = jest.fn();
jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: jest.fn(() => ({ createNotification: mockCreateNotification })),
}));

const mockUseFreeUploadFeature = jest.mocked(useFreeUploadFeature);
const mockUseFreeUploadApi = jest.mocked(useFreeUploadApi);
const mockSendErrorReport = jest.mocked(sendErrorReport);

describe('useInitializeFreeUploadTimer - initializeTimer function', () => {
    const mockStartFreeUploadTimer = jest.fn();
    const mockCheckOnboardingStatus = jest.fn();

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
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should successfully initialize timer when EndTime is not null', async () => {
        const now = Date.now();
        const endTime = Math.floor((now + 9.5 * 60 * 1000) / 1000);

        mockStartFreeUploadTimer.mockResolvedValue({ EndTime: endTime });

        const { result } = renderHook(() => useInitializeFreeUploadTimer());

        await result.current.initializeTimer();

        const storeState = useFreeUploadStore.getState();

        expect(mockStartFreeUploadTimer).toHaveBeenCalledTimes(1);
        expect(storeState.isFreeUploadInProgress).toBe(true);
        expect(storeState.targetTime).toBe(endTime * 1000);
        expect(mockCreateNotification).not.toHaveBeenCalled();
        expect(mockSendErrorReport).not.toHaveBeenCalled();
    });

    it('should show error notification and report error when startFreeUploadTimer fails', async () => {
        const error = new Error('API failure');
        mockStartFreeUploadTimer.mockRejectedValue(error);

        const { result } = renderHook(() => useInitializeFreeUploadTimer());

        await result.current.initializeTimer();

        const storeState = useFreeUploadStore.getState();

        expect(mockStartFreeUploadTimer).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
            })
        );
        expect(storeState.isFreeUploadInProgress).toBe(false);
        expect(storeState.targetTime).toBe(0);
        expect(mockSendErrorReport).toHaveBeenCalledWith(error);
    });
});
