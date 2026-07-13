import { renderHook } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryVpnAlwaysOnPolicyEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import { useAlwaysOnPolicyTelemetry } from './useAlwaysOnPolicyTelemetry';

vi.mock('@proton/components/hooks/useApi', () => ({ default: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/metrics', () => ({ sendTelemetryReport: vi.fn() }));

const mockUseApi = useApi as MockedFunction<typeof useApi>;
const mockSendTelemetryReport = sendTelemetryReport as MockedFunction<typeof sendTelemetryReport>;

const api = vi.fn();

describe('useAlwaysOnPolicyTelemetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseApi.mockReturnValue(api);
    });

    it('sends configureOpened with the given source', () => {
        const { result } = renderHook(() => useAlwaysOnPolicyTelemetry());

        result.current.sendConfigureOpenedReport('reconfigure');

        expect(mockSendTelemetryReport).toHaveBeenCalledWith({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.configureOpened,
            dimensions: { source: 'reconfigure' },
            delay: false,
        });
    });

    it('sends generateStart, generateSuccess and generateFailure', () => {
        const { result } = renderHook(() => useAlwaysOnPolicyTelemetry());

        result.current.sendGenerateStartReport();
        result.current.sendGenerateSuccessReport(true);
        result.current.sendGenerateFailureReport();

        expect(mockSendTelemetryReport).toHaveBeenNthCalledWith(1, {
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.generateStart,
            delay: false,
        });
        expect(mockSendTelemetryReport).toHaveBeenNthCalledWith(2, {
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.generateSuccess,
            dimensions: { restrictLogins: 'true' },
            delay: false,
        });
        expect(mockSendTelemetryReport).toHaveBeenNthCalledWith(3, {
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.generateFailure,
            delay: false,
        });
    });

    it('sends instructionsViewed and removeModalOpened', () => {
        const { result } = renderHook(() => useAlwaysOnPolicyTelemetry());

        result.current.sendInstructionsViewedReport();
        result.current.sendRemoveModalOpenedReport();

        expect(mockSendTelemetryReport).toHaveBeenNthCalledWith(1, {
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.instructionsViewed,
            delay: false,
        });
        expect(mockSendTelemetryReport).toHaveBeenNthCalledWith(2, {
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.removeModalOpened,
            delay: false,
        });
    });
});
