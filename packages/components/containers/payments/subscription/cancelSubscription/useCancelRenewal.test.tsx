import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { Renew } from '@proton/payments';
import { type FeedbackDowngradeData, changeRenewState } from '@proton/payments/core/api/api';
import { useIsB2BTrial } from '@proton/payments/ui';

import { OPEN_TRIAL_CANCELED_MODAL } from '../../../topBanners/constants';
import { useCancelRenewal } from './useCancelRenewal';

jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/components/hooks/useEventManager');
jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/payments/ui');

const mockApi = jest.fn().mockResolvedValue({});
const mockEventManagerCall = jest.fn().mockResolvedValue(undefined);
const mockCreateNotification = jest.fn().mockReturnValue('notification-id');
const mockHideNotification = jest.fn();

jest.mocked(useApi).mockReturnValue(mockApi);
jest.mocked(useEventManager).mockReturnValue({ call: mockEventManagerCall } as any);
jest.mocked(useNotifications).mockReturnValue({
    createNotification: mockCreateNotification,
    hideNotification: mockHideNotification,
} as any);
jest.mocked(useSubscription).mockReturnValue([{} as any, false]);
jest.mocked(useOrganization).mockReturnValue([{} as any, false]);
jest.mocked(useIsB2BTrial).mockReturnValue(false);

const feedback: FeedbackDowngradeData = {
    Reason: 'DIFFERENT_ACCOUNT',
    Feedback: '',
    ReasonDetails: '',
    Context: 'mail',
};

describe('useCancelRenewal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call changeRenewState API with feedback', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback);

        expect(mockApi).toHaveBeenCalledWith(
            changeRenewState({
                RenewalState: Renew.Disabled,
                CancellationFeedback: feedback,
            })
        );
    });

    it('should return cancelled status', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        const response = await result.current.cancelSubscriptionRenewal(feedback);

        expect(response).toEqual({ status: 'cancelled' });
    });

    it('should call eventManager.call when refreshState is true (default)', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback);

        expect(mockEventManagerCall).toHaveBeenCalled();
    });

    it('should not call eventManager.call when refreshState is false', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback, false);

        expect(mockEventManagerCall).not.toHaveBeenCalled();
    });

    it('should show progress notification and hide it after completion', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback);

        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
        expect(mockHideNotification).toHaveBeenCalledWith('notification-id');
    });

    it('should show success notification when not B2B trial', async () => {
        jest.mocked(useIsB2BTrial).mockReturnValue(false);
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback);

        expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    });

    it('should not show success notification for B2B trial', async () => {
        jest.mocked(useIsB2BTrial).mockReturnValue(true);
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    });

    it('should dispatch trial canceled event for B2B trial', async () => {
        jest.mocked(useIsB2BTrial).mockReturnValue(true);
        const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback);

        expect(dispatchEventSpy).toHaveBeenCalledWith(new CustomEvent(OPEN_TRIAL_CANCELED_MODAL));
        dispatchEventSpy.mockRestore();
    });

    it('should not dispatch trial canceled event when not B2B trial', async () => {
        jest.mocked(useIsB2BTrial).mockReturnValue(false);
        const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(feedback);

        expect(dispatchEventSpy).not.toHaveBeenCalled();
        dispatchEventSpy.mockRestore();
    });

    it('should hide notification even if API call fails', async () => {
        mockApi.mockRejectedValueOnce(new Error('API error'));
        const { result } = componentsHookRenderer(useCancelRenewal);

        await expect(result.current.cancelSubscriptionRenewal(feedback)).rejects.toThrow('API error');

        expect(mockHideNotification).toHaveBeenCalledWith('notification-id');
    });
});
