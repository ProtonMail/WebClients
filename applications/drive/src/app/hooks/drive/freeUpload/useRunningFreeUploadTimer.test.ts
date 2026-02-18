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

const mockCreateNotification = jest.fn();
jest.mock('@proton/components/hooks/useNotifications', () => ({
    __esModule: true,
    default: jest.fn(() => ({ createNotification: mockCreateNotification })),
}));

const mockUseFreeUploadFeature = jest.mocked(useFreeUploadFeature);
const mockUseFreeUploadApi = jest.mocked(useFreeUploadApi);
const mockUseIsFreeUploadInProgress = jest.mocked(useIsFreeUploadInProgress);
const mockSendErrorReport = jest.mocked(sendErrorReport);

describe('useRunningFreeUploadTimer', () => {
    const mockCheckFreeUploadTimer = jest.fn();

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
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should successfully begin countdown when EndTime is not null', async () => {
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
        expect(mockCreateNotification).not.toHaveBeenCalled();
        expect(mockSendErrorReport).not.toHaveBeenCalled();
    });

    it('should report error when checkFreeUploadTimer fails', async () => {
        const now = Date.now();
        const recentCreateTime = Math.floor((now - 30 * 60 * 1000) / 1000);
        const error = new Error('API failure');

        mockCheckFreeUploadTimer.mockRejectedValue(error);

        await act(async () => {
            renderHook(() => useRunningFreeUploadTimer(recentCreateTime));
            await new Promise((resolve) => process.nextTick(resolve));
        });

        const storeState = useFreeUploadStore.getState();
        expect(mockCheckFreeUploadTimer).toHaveBeenCalledTimes(1);
        expect(storeState.isFreeUploadInProgress).toBe(false);
        expect(storeState.targetTime).toBe(0);
        expect(mockSendErrorReport).toHaveBeenCalledWith(error);
    });
});
