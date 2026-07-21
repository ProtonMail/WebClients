import { renderHook } from '@testing-library/react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { TelemetryAccountCancellationFlowFeedbackEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

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

jest.mock('@proton/shared/lib/helpers/metrics', () => ({
    sendTelemetryReportWithBaseDimensions: jest.fn(),
}));
const mockSendTelemetryReport = sendTelemetryReportWithBaseDimensions as jest.MockedFunction<any>;

describe('useFeedbackFirstTelemetry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSubscription.mockReturnValue([{ CouponCode: null }, false]);
        mockUseUserSettings.mockReturnValue([{}, false]);
    });

    it('should send the managed_externally telemetry event', () => {
        const { result } = renderHook(() => useFeedbackFirstTelemetry());

        result.current.sendManagedExternally();

        expect(mockSendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(mockSendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                event: TelemetryAccountCancellationFlowFeedbackEvents.managedExternally,
            })
        );
    });
});
