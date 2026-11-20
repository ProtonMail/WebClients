import { act, renderHook } from '@testing-library/react';

import { sendErrorReport } from '@proton/drive/legacy/errorHandling';

import { useFreeUploadStore } from './freeUpload.store';
import { useFreeUploadApi } from './useFreeUploadApi';
import { useFreeUploadFeature } from './useFreeUploadFeature';
import { useIsFreeUploadInProgress } from './useIsFreeUploadInProgress';
import { useRunningFreeUploadTimer } from './useRunningFreeUploadTimer';

vi.mock('./useFreeUploadFeature');
vi.mock('./useFreeUploadApi');
vi.mock('./useIsFreeUploadInProgress');
vi.mock('@proton/drive/legacy/errorHandling');
vi.mock('../../../modals/FreeUploadOverModal/useFreeUploadOverModal', () => ({
    useFreeUploadOverModal: vi.fn(() => [null, vi.fn()]),
}));
vi.mock('@proton/components/hooks/useErrorHandler', () => ({
    __esModule: true,
    default: vi.fn(() => vi.fn()),
}));

const mockCreateNotification = vi.fn();
vi.mock('@proton/app-context/useNotifications', () => ({
    __esModule: true,
    useNotifications: vi.fn(() => ({ createNotification: mockCreateNotification })),
}));

const mockUseFreeUploadFeature = vi.mocked(useFreeUploadFeature);
const mockUseFreeUploadApi = vi.mocked(useFreeUploadApi);
const mockUseIsFreeUploadInProgress = vi.mocked(useIsFreeUploadInProgress);
const mockSendErrorReport = vi.mocked(sendErrorReport);

describe('useRunningFreeUploadTimer', () => {
    const mockCheckFreeUploadTimer = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

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
            startFreeUploadTimer: vi.fn(),
            checkOnboardingStatus: vi.fn(),
        } as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
