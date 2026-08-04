import { renderHook } from '@testing-library/react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    TelemetryAccountCancellationFlowFeedbackEvents,
    sendMultipleTelemetryData,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';

import { useFeedbackFirstTelemetry } from '../useFeedbackFirstTelemetry';

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: () => jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: () => [{}, false],
}));

jest.mock('@proton/account/subscription/hooks');
const mockUseSubscription = useSubscription as jest.MockedFunction<any>;

jest.mock('@proton/account/userSettings/hooks');
const mockUseUserSettings = useUserSettings as jest.MockedFunction<any>;

jest.mock('@proton/shared/lib/api/helpers/customConfig', () => ({
    getSilentApi: jest.fn(),
}));
const mockGetSilentApi = getSilentApi as jest.MockedFunction<any>;

jest.mock('@proton/shared/lib/api/telemetry', () => {
    const actual = jest.requireActual('@proton/shared/lib/api/telemetry');
    return {
        ...actual,
        sendTelemetryData: jest.fn((data) => ({ url: 'data/v1/stats', data })),
        sendMultipleTelemetryData: jest.fn(() => ({ url: 'data/v1/stats/multiple' })),
    };
});
const mockSendTelemetryData = sendTelemetryData as jest.MockedFunction<any>;
const mockSendMultipleTelemetryData = sendMultipleTelemetryData as jest.MockedFunction<any>;

jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    getBaseTelemetryDimensions: jest.fn(() => ({})),
}));

describe('useFeedbackFirstTelemetry', () => {
    let mockSilentApi: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSilentApi = jest.fn();
        mockGetSilentApi.mockReturnValue(mockSilentApi);
        mockUseSubscription.mockReturnValue([{ CouponCode: null }, false]);
        mockUseUserSettings.mockReturnValue([{}, false]);
    });

    it('should send the managed_externally telemetry event as an individual request', () => {
        const { result } = renderHook(() => useFeedbackFirstTelemetry());

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
        const { result } = renderHook(() => useFeedbackFirstTelemetry());

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
        const { result } = renderHook(() => useFeedbackFirstTelemetry());

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
        const { result } = renderHook(() => useFeedbackFirstTelemetry());

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

        mockSilentApi.mock.calls.forEach(([request]: [any]) => {
            expect(request.url).toBe('data/v1/stats');
        });
        expect(mockSendMultipleTelemetryData).not.toHaveBeenCalled();
    });
});
