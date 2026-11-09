import { act, renderHook, screen } from '@testing-library/react';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { TelemetryAccountCancellationFlowFeedbackEvents } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { renderWithProviders } from '../../../../testing/renderWithProviders';
import { useFeedbackFirstCancellationFlow } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstCancellationFlow';
import { getFeedbackFirstEligibility } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstEligibility';
import { useSendFeedbackFirstReport } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstTelemetry';
import { useStartCancellation } from './useStartCancellation';

const mockRedirectToCancellationFlow = jest.fn();
jest.mock('../cancellationFlow/useCancellationFlow', () => ({
    __esModule: true,
    ...jest.requireActual('../cancellationFlow/useCancellationFlow'),
    default: () => ({ redirectToCancellationFlow: mockRedirectToCancellationFlow }),
}));

jest.mock('../cancellationFlow/useCancellationTelemetry', () => ({
    __esModule: true,
    default: () => ({ sendStartCancellationSectionReport: jest.fn() }),
}));

const mockCancelSubscription = jest.fn();
jest.mock('./useCancelSubscriptionFlow', () => ({
    useCancelSubscriptionFlow: () => ({
        loadingCancelSubscription: false,
        cancelSubscriptionModals: null,
        cancelSubscription: mockCancelSubscription,
    }),
}));

const mockStartFeedbackFirstFlow = jest.fn();
const mockSendFeedbackFirstReport = jest.fn();
jest.mock('../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstCancellationFlow');
jest.mock('../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstEligibility');
jest.mock('../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstTelemetry');
jest.mock('@proton/account/entitlementCatalog/hooks');

const withId = (subscription: Subscription, ID: string): Subscription => ({ ...subscription, ID });

describe('useStartCancellation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useEntitlementCatalog).mockReturnValue([
            buildEntitlementCatalog({ [PLANS.BUNDLE_PRO_2024]: [EntitlementName.Business] }),
            false,
        ] as any);
        jest.mocked(getFeedbackFirstEligibility).mockReturnValue({ hasB2BAccess: false, hasB2CAccess: false });
        jest.mocked(useFeedbackFirstCancellationFlow).mockReturnValue({
            startFlow: mockStartFeedbackFirstFlow,
            modals: null,
        } as any);
        jest.mocked(useSendFeedbackFirstReport).mockReturnValue(mockSendFeedbackFirstReport);
    });

    const start = (subscription: Subscription) => {
        const { result } = renderHook(() => useStartCancellation({ app: APPS.PROTONACCOUNT }));
        act(() => result.current.startCancellation(subscription));
        return result;
    };

    it('runs the feedback-first flow on the given subscription', () => {
        jest.mocked(getFeedbackFirstEligibility).mockReturnValue({ hasB2BAccess: false, hasB2CAccess: true });
        const mail = withId(buildSubscription(PLANS.MAIL), 'sub-mail');

        start(mail);

        expect(getFeedbackFirstEligibility).toHaveBeenCalledWith(mail);
        expect(mockStartFeedbackFirstFlow).toHaveBeenCalledWith(mail);
        expect(mockSendFeedbackFirstReport).toHaveBeenCalledWith(
            mail,
            TelemetryAccountCancellationFlowFeedbackEvents.startCancellation
        );
        expect(mockCancelSubscription).not.toHaveBeenCalled();
    });

    it('redirects to the cancellation reminder of the given subscription', () => {
        const drive = withId(buildSubscription(PLANS.DRIVE), 'sub-drive');

        start(drive);

        expect(mockRedirectToCancellationFlow).toHaveBeenCalledWith(drive);
        expect(mockCancelSubscription).not.toHaveBeenCalled();
    });

    it('cancels a business trial directly', () => {
        const trial = { ...withId(buildSubscription(PLANS.BUNDLE_PRO_2024), 'sub-trial'), IsTrial: true };

        start(trial);

        expect(mockCancelSubscription).toHaveBeenCalledWith({ subscription: trial });
        expect(mockRedirectToCancellationFlow).not.toHaveBeenCalled();
    });

    it('cancels without the upsell a subscription without a reminder flow', () => {
        const pass = withId(buildSubscription(PLANS.PASS), 'sub-pass');

        start(pass);

        expect(mockCancelSubscription).toHaveBeenCalledWith({
            subscription: pass,
            subscriptionReminderFlow: undefined,
            upsellPlanId: undefined,
            skipUpsell: true,
        });
        expect(mockRedirectToCancellationFlow).not.toHaveBeenCalled();
    });

    it('tells the user to cancel a store subscription in the store, without starting a flow', () => {
        jest.mocked(getFeedbackFirstEligibility).mockReturnValue({ hasB2BAccess: false, hasB2CAccess: true });
        const drive = {
            ...withId(buildSubscription(PLANS.DRIVE), 'sub-drive'),
            External: SubscriptionPlatform.Android,
        };

        const result = start(drive);
        renderWithProviders(result.current.modals);

        expect(screen.getByTestId('InAppPurchaseModal/text')).toHaveTextContent('Play Store');
        expect(mockStartFeedbackFirstFlow).not.toHaveBeenCalled();
        expect(mockRedirectToCancellationFlow).not.toHaveBeenCalled();
        expect(mockCancelSubscription).not.toHaveBeenCalled();
    });
});
