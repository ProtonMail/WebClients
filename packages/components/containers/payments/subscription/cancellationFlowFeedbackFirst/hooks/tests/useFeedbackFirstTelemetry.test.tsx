import { renderHook } from '@testing-library/react';
import type { Mock, MockedFunction } from 'vitest';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useSilentApi } from '@proton/app-context/useSilentApi';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import {
    TelemetryAccountCancellationFlowFeedbackEvents,
    sendMultipleTelemetryData,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';
import { getBaseTelemetryDimensions } from '@proton/shared/lib/helpers/metrics';

import { useFeedbackFirstTelemetry } from '../useFeedbackFirstTelemetry';

vi.mock('@proton/app-context/useSilentApi');
const mockUseSilentApi = useSilentApi as MockedFunction<any>;

vi.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{}, false],
}));

vi.mock('@proton/account/subscription/hooks');
vi.mock('@proton/account/entitlementCatalog/hooks', () => ({ useEntitlementCatalog: () => [undefined] }));
const mockUseSubscription = useSubscription as MockedFunction<any>;

vi.mock('@proton/account/userSettings/hooks');
const mockUseUserSettings = useUserSettings as MockedFunction<any>;

vi.mock('@proton/shared/lib/api/telemetry', async () => {
    const actual = await vi.importActual('@proton/shared/lib/api/telemetry');
    return {
        ...actual,
        sendTelemetryData: vi.fn((data) => ({ url: 'data/v1/stats', data })),
        sendMultipleTelemetryData: vi.fn(() => ({ url: 'data/v1/stats/multiple' })),
    };
});
const mockSendTelemetryData = sendTelemetryData as MockedFunction<any>;
const mockSendMultipleTelemetryData = sendMultipleTelemetryData as MockedFunction<any>;

vi.mock('@proton/shared/lib/helpers/metrics', () => ({
    getBaseTelemetryDimensions: vi.fn(() => ({})),
}));

const mailSubscription = buildSubscription(PLANS.MAIL, { CouponCode: 'MAILCOUPON' });
const lumoSubscription = buildSubscription(PLANS.LUMO, { CouponCode: 'LUMOCOUPON' });

describe('useFeedbackFirstTelemetry', () => {
    let mockSilentApi: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSilentApi = vi.fn();
        mockUseSilentApi.mockReturnValue(mockSilentApi);
        mockUseSubscription.mockReturnValue([mailSubscription, false]);
        mockUseUserSettings.mockReturnValue([{}, false]);
    });

    it('should send the managed_externally telemetry event as an individual request', () => {
        const { result } = renderHook(() => useFeedbackFirstTelemetry(lumoSubscription));

        result.current.sendManagedExternally();

        expect(mockSendTelemetryData).toHaveBeenCalledTimes(1);
        expect(mockSendTelemetryData).toHaveBeenCalledWith(
            expect.objectContaining({
                Event: TelemetryAccountCancellationFlowFeedbackEvents.managedExternally,
            })
        );
        expect(mockSilentApi).toHaveBeenCalledTimes(1);
        expect(mockSilentApi).toHaveBeenCalledWith({ url: 'data/v1/stats', data: expect.anything() });
    });

    it('should report a skipped cancellation reason when no reason was given', () => {
        const { result } = renderHook(() => useFeedbackFirstTelemetry(lumoSubscription));

        const feedback = { Reason: '', Feedback: '', ReasonDetails: '' } as any;

        result.current.sendFeedbackReport(feedback);
        result.current.sendSecondStepReport(feedback);

        expect(mockSendTelemetryData).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                Event: TelemetryAccountCancellationFlowFeedbackEvents.feedbackStep,
                Dimensions: expect.objectContaining({ cancellationReason: 'SKIPPED' }),
            })
        );
        expect(mockSendTelemetryData).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                Event: TelemetryAccountCancellationFlowFeedbackEvents.secondStep,
                Dimensions: expect.objectContaining({ cancellationReason: 'SKIPPED' }),
            })
        );
    });

    it('should report the selected cancellation reason when one was given', () => {
        const { result } = renderHook(() => useFeedbackFirstTelemetry(lumoSubscription));

        const feedback = { Reason: 'TOO_EXPENSIVE', Feedback: '', ReasonDetails: '' } as any;

        result.current.sendFeedbackReport(feedback);

        expect(mockSendTelemetryData).toHaveBeenCalledWith(
            expect.objectContaining({
                Event: TelemetryAccountCancellationFlowFeedbackEvents.feedbackStep,
                Dimensions: expect.objectContaining({ cancellationReason: 'TOO_EXPENSIVE' }),
            })
        );
    });

    it('should send each event as a separate individual request rather than batching them', () => {
        const { result } = renderHook(() => useFeedbackFirstTelemetry(lumoSubscription));

        const feedback = { Reason: 'reason', ReasonDetails: 'Other' } as any;

        result.current.startCancellation();
        result.current.sendFeedbackReport(feedback);
        result.current.sendSecondStepReport(feedback);
        result.current.sendManagedExternally();
        result.current.sendConfirmCancellation();

        expect(mockSendTelemetryData).toHaveBeenCalledTimes(5);
        expect(mockSilentApi).toHaveBeenCalledTimes(5);

        const events = mockSendTelemetryData.mock.calls.map(([data]: [any]) => data.Event);
        expect(events).toEqual([
            TelemetryAccountCancellationFlowFeedbackEvents.startCancellation,
            TelemetryAccountCancellationFlowFeedbackEvents.feedbackStep,
            TelemetryAccountCancellationFlowFeedbackEvents.secondStep,
            TelemetryAccountCancellationFlowFeedbackEvents.managedExternally,
            TelemetryAccountCancellationFlowFeedbackEvents.confirmCancellation,
        ]);

        mockSilentApi.mock.calls.forEach(([request]: any[]) => {
            expect(request.url).toBe('data/v1/stats');
        });
        expect(mockSendMultipleTelemetryData).not.toHaveBeenCalled();
    });

    it('should describe the given subscription, not the one from useSubscription', () => {
        const { result } = renderHook(() => useFeedbackFirstTelemetry(lumoSubscription));

        result.current.startCancellation();

        expect(mockSendTelemetryData).toHaveBeenCalledWith(
            expect.objectContaining({ Dimensions: expect.objectContaining({ couponCode: 'LUMOCOUPON' }) })
        );
        expect(getBaseTelemetryDimensions).toHaveBeenCalledWith(
            expect.objectContaining({ subscription: lumoSubscription })
        );
    });
});
