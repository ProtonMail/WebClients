import { renderHook } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { useApi } from '@proton/app-context/useApi';
import { TelemetryMeasurementGroups, TelemetryVpnAlwaysOnPolicyEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import { useAlwaysOnPolicyTelemetry } from './useAlwaysOnPolicyTelemetry';

vi.mock('@proton/app-context/useApi', () => ({ useApi: vi.fn() }));
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

        result.current.sendConfigureOpenedReport('reconfigure-new-profile');

        expect(mockSendTelemetryReport).toHaveBeenCalledWith({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.configureOpened,
            dimensions: { source: 'reconfigure-new-profile' },
            delay: false,
        });
    });

    it('sends generateStart, generateSuccess and generateFailure', () => {
        const { result } = renderHook(() => useAlwaysOnPolicyTelemetry());

        result.current.sendGenerateStartReport();
        result.current.sendGenerateSuccessReport();
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

    it('sends learnMoreClicked with the platform', () => {
        const { result } = renderHook(() => useAlwaysOnPolicyTelemetry());

        result.current.sendLearnMoreClickedReport('windows');

        expect(mockSendTelemetryReport).toHaveBeenCalledWith({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.learnMoreClicked,
            dimensions: { platform: 'windows' },
            delay: false,
        });
    });

    it.each(['build', 'download-page'] as const)(
        'sends downloadLatestClicked with source %s and the version',
        (source) => {
            const { result } = renderHook(() => useAlwaysOnPolicyTelemetry());

            result.current.sendDownloadLatestClickedReport(source, '5.3.0');

            expect(mockSendTelemetryReport).toHaveBeenCalledWith({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
                event: TelemetryVpnAlwaysOnPolicyEvents.downloadLatestClicked,
                dimensions: { source, version: '5.3.0' },
                delay: false,
            });
        }
    );

    it.each(['build', 'download-page'] as const)(
        'sends clientDownloadClicked with source %s and the version',
        (source) => {
            const { result } = renderHook(() => useAlwaysOnPolicyTelemetry());

            result.current.sendClientDownloadClickedReport(source, '5.3.0');

            expect(mockSendTelemetryReport).toHaveBeenCalledWith({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
                event: TelemetryVpnAlwaysOnPolicyEvents.clientDownloadClicked,
                dimensions: { source, version: '5.3.0' },
                delay: false,
            });
        }
    );
});
