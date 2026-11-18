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

import { renderWithProviders } from '../../../../testing/vitest/renderWithProviders';
import { useFeedbackFirstCancellationFlow } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstCancellationFlow';
import { getFeedbackFirstEligibility } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstEligibility';
import { useSendFeedbackFirstReport } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstTelemetry';
import { useStartCancellation } from './useStartCancellation';

const mockRedirectToCancellationFlow = vi.fn();
vi.mock('../cancellationFlow/useCancellationFlow', async () => ({
    __esModule: true,
    ...(await vi.importActual('../cancellationFlow/useCancellationFlow')),
    default: () => ({ redirectToCancellationFlow: mockRedirectToCancellationFlow }),
}));

vi.mock('../cancellationFlow/useCancellationTelemetry', () => ({
    __esModule: true,
    default: () => ({ sendStartCancellationSectionReport: vi.fn() }),
}));

const mockCancelSubscription = vi.fn();
vi.mock('./useCancelSubscriptionFlow', () => ({
    useCancelSubscriptionFlow: () => ({
        loadingCancelSubscription: false,
        cancelSubscriptionModals: null,
        cancelSubscription: mockCancelSubscription,
    }),
}));

const mockStartFeedbackFirstFlow = vi.fn();
const mockSendFeedbackFirstReport = vi.fn();
vi.mock('../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstCancellationFlow');
vi.mock('../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstEligibility');
vi.mock('../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstTelemetry');
vi.mock('@proton/account/entitlementCatalog/hooks');

const withId = (subscription: Subscription, ID: string): Subscription => ({ ...subscription, ID });

describe('useStartCancellation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useEntitlementCatalog).mockReturnValue([
            buildEntitlementCatalog({ [PLANS.BUNDLE_PRO_2024]: [EntitlementName.Business] }),
            false,
        ] as any);
        vi.mocked(getFeedbackFirstEligibility).mockReturnValue({ hasB2BAccess: false, hasB2CAccess: false });
        vi.mocked(useFeedbackFirstCancellationFlow).mockReturnValue({
            startFlow: mockStartFeedbackFirstFlow,
            modals: null,
        } as any);
        vi.mocked(useSendFeedbackFirstReport).mockReturnValue(mockSendFeedbackFirstReport);
    });

    const start = (subscription: Subscription) => {
        const { result } = renderHook(() => useStartCancellation({ app: APPS.PROTONACCOUNT }));
        act(() => result.current.startCancellation(subscription));
        return result;
    };

    it('runs the feedback-first flow on the given subscription', () => {
        vi.mocked(getFeedbackFirstEligibility).mockReturnValue({ hasB2BAccess: false, hasB2CAccess: true });
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
        vi.mocked(getFeedbackFirstEligibility).mockReturnValue({ hasB2BAccess: false, hasB2CAccess: true });
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
