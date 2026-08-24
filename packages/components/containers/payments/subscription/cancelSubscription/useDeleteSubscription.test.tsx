import { type FeedbackDowngradeData, deleteSubscription } from '@proton/payments/core/api/api';

import useApi from '../../../../hooks/useApi';
import useEventManager from '../../../../hooks/useEventManager';
import useNotifications from '../../../../hooks/useNotifications';
import { componentsHookRenderer } from '../../../contacts/tests/render';
import { useCancellationLoadingStep } from '../cancellationSteps/useCancellationLoadingStep';
import { useDeleteSubscription } from './useDeleteSubscription';

jest.mock('../../../../hooks/useApi');
jest.mock('../../../../hooks/useEventManager');
jest.mock('../../../../hooks/useNotifications');
jest.mock('../cancellationSteps/useCancellationLoadingStep');

const mockApi = jest.fn().mockResolvedValue({});
const mockEventManagerCall = jest.fn().mockResolvedValue(undefined);
const mockCreateNotification = jest.fn();
const mockShow = jest.fn();
const mockHide = jest.fn();

jest.mocked(useApi).mockReturnValue(mockApi);
jest.mocked(useEventManager).mockReturnValue({ call: mockEventManagerCall } as any);
jest.mocked(useNotifications).mockReturnValue({
    createNotification: mockCreateNotification,
} as any);
jest.mocked(useCancellationLoadingStep).mockReturnValue({
    show: mockShow,
    hide: mockHide,
} as any);

const feedback: FeedbackDowngradeData = {
    Reason: 'DIFFERENT_ACCOUNT',
    Feedback: '',
    ReasonDetails: '',
    Context: 'mail',
};

describe('useDeleteSubscription', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call show for the cancellation loading modal', async () => {
        const { result } = componentsHookRenderer(useDeleteSubscription);

        await result.current.deleteUserSubscription(feedback);

        expect(mockShow).toHaveBeenCalled();
    });

    it('should call deleteSubscription API with feedback', async () => {
        const { result } = componentsHookRenderer(useDeleteSubscription);

        await result.current.deleteUserSubscription(feedback);

        expect(mockApi).toHaveBeenCalledWith(deleteSubscription(feedback));
    });

    it('should call eventManager.call after API call', async () => {
        const { result } = componentsHookRenderer(useDeleteSubscription);

        await result.current.deleteUserSubscription(feedback);

        expect(mockEventManagerCall).toHaveBeenCalled();
    });

    it('should show success notification', async () => {
        const { result } = componentsHookRenderer(useDeleteSubscription);

        await result.current.deleteUserSubscription(feedback);

        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ text: expect.any(String) }));
    });

    it('should return downgraded status', async () => {
        const { result } = componentsHookRenderer(useDeleteSubscription);

        const response = await result.current.deleteUserSubscription(feedback);

        expect(response).toEqual({ status: 'downgraded' });
    });

    it('should hide loading modal even if API call fails', async () => {
        mockApi.mockRejectedValueOnce(new Error('API error'));
        const { result } = componentsHookRenderer(useDeleteSubscription);

        await expect(result.current.deleteUserSubscription(feedback)).rejects.toThrow('API error');

        expect(mockHide).toHaveBeenCalled();
    });
});
