import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';

import useEventManager from '../../../../hooks/useEventManager';
import { componentsHookRenderer } from '../../../contacts/tests/render';
import { OPEN_TRIAL_CANCELED_MODAL } from '../../../topBanners/constants';
import type { FeedbackDowngradeFormData } from '../content/interface';
import { useCancelRenewal } from './useCancelRenewal';

jest.mock('@proton/app-context/useApi');
jest.mock('../../../../hooks/useEventManager');
jest.mock('@proton/app-context/useNotifications');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/account/entitlementCatalog/hooks');

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
const mailSubscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const lumoSubscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };
const trialSubscription = buildSubscription(PLANS.BUNDLE_PRO_2024, { IsTrial: true });
const nonTrialSubscription = buildSubscription(PLANS.BUNDLE_PRO_2024, { IsTrial: false });

jest.mocked(useSubscription).mockReturnValue([mailSubscription, false]);
jest.mocked(useOrganization).mockReturnValue([{} as any, false]);
jest.mocked(useEntitlementCatalog).mockReturnValue([
    buildEntitlementCatalog({ [PLANS.BUNDLE_PRO_2024]: [EntitlementName.Business] }),
    false,
]);

const feedback: FeedbackDowngradeFormData = {
    Reason: 'DIFFERENT_ACCOUNT',
    Feedback: '',
    ReasonDetails: '',
    Context: 'mail',
};

describe('useCancelRenewal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should cancel the given subscription by its ID with feedback', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(lumoSubscription, feedback);

        expect(mockApi).toHaveBeenCalledWith({
            url: 'payments/v5/subscription/sub-lumo/renew',
            method: 'put',
            data: {
                RenewalState: Renew.Disabled,
                CancellationFeedback: {
                    Reason: 'DIFFERENT_ACCOUNT',
                    Feedback: null,
                    ReasonDetails: null,
                    Context: 'mail',
                },
            },
        });
    });

    it('should decide the trial notification from the given subscription, not from useSubscription', async () => {
        jest.mocked(useSubscription).mockReturnValueOnce([nonTrialSubscription, false]);
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(trialSubscription, feedback);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    });

    it('should return cancelled status', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        const response = await result.current.cancelSubscriptionRenewal(lumoSubscription, feedback);

        expect(response).toEqual({ status: 'cancelled' });
    });

    it('should call eventManager.call when refreshState is true (default)', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(lumoSubscription, feedback);

        expect(mockEventManagerCall).toHaveBeenCalled();
    });

    it('should not call eventManager.call when refreshState is false', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(lumoSubscription, feedback, false);

        expect(mockEventManagerCall).not.toHaveBeenCalled();
    });

    it('should show progress notification and hide it after completion', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(lumoSubscription, feedback);

        expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
        expect(mockHideNotification).toHaveBeenCalledWith('notification-id');
    });

    it('should show success notification when not B2B trial', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(nonTrialSubscription, feedback);

        expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    });

    it('should not show success notification for B2B trial', async () => {
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(trialSubscription, feedback);

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    });

    it('should dispatch trial canceled event for B2B trial', async () => {
        const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(trialSubscription, feedback);

        expect(dispatchEventSpy).toHaveBeenCalledWith(new CustomEvent(OPEN_TRIAL_CANCELED_MODAL));
        dispatchEventSpy.mockRestore();
    });

    it('should not dispatch trial canceled event when not B2B trial', async () => {
        const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
        const { result } = componentsHookRenderer(useCancelRenewal);

        await result.current.cancelSubscriptionRenewal(nonTrialSubscription, feedback);

        expect(dispatchEventSpy).not.toHaveBeenCalled();
        dispatchEventSpy.mockRestore();
    });

    it('should hide notification even if API call fails', async () => {
        mockApi.mockRejectedValueOnce(new Error('API error'));
        const { result } = componentsHookRenderer(useCancelRenewal);

        await expect(result.current.cancelSubscriptionRenewal(lumoSubscription, feedback)).rejects.toThrow('API error');

        expect(mockHideNotification).toHaveBeenCalledWith('notification-id');
    });
});
