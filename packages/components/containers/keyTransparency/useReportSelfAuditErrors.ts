import { AddressAuditStatus, SelfAuditResult, ktSentryReport } from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    TelemetryKeyTransparencySelfAuditErrorEvents,
    TelemetryMeasurementGroups,
    TelemetryReport,
} from '@proton/shared/lib/api/telemetry';
import { sendMultipleTelemetryReports } from '@proton/shared/lib/helpers/metrics';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { getWarningReason } from '@proton/shared/lib/keyTransparency/telemetry';

import { useApi } from '../../hooks';

const useReportSelfAuditErrors = () => {
    const api = getSilentApi(useApi());

    const reportSelfAuditErrors = async (selfAuditResult: SelfAuditResult) => {
        const failedAddressAuditsResults = selfAuditResult.addressAuditResults.filter(
            ({ status }) => status !== AddressAuditStatus.Success
        );
        const failedLocalStorageAuditsOwn = selfAuditResult.localStorageAuditResultsOwnAddress.filter(
            ({ success }) => !success
        );
        const failedLocalStorageAuditsOther = selfAuditResult.localStorageAuditResultsOtherAddress.filter(
            ({ success }) => !success
        );

        const failedAddressAudits = failedAddressAuditsResults.map(({ email, status, warningDetails }) => ({
            email,
            status,
            warningDetails,
        }));
        const failedLSAuditsOwn = failedLocalStorageAuditsOwn.map(({ email }) => email);
        const failedLSAuditsOther = failedLocalStorageAuditsOther.map(({ email }) => email);

        const tooManyRetries = selfAuditResult.error?.tooManyRetries;

        if (failedAddressAudits.length || failedLSAuditsOwn.length || failedLSAuditsOther.length || tooManyRetries) {
            ktSentryReport('Self audit would display an error', {
                failedAddressAudits,
                failedLSAuditsOwn,
                failedLSAuditsOther,
                tooManyRetries: selfAuditResult.error?.tooManyRetries,
            });

            const reports: TelemetryReport[] = [];

            const group = {
                measurementGroup: TelemetryMeasurementGroups.keyTransparency,
                event: TelemetryKeyTransparencySelfAuditErrorEvents.self_audit_error,
            };

            if (tooManyRetries) {
                const dimensions: SimpleMap<string> = {
                    type: 'too_many_retries',
                    result: 'warning',
                    reason: 'too_many_retries',
                };
                reports.push({
                    ...group,
                    dimensions,
                });
            }

            failedAddressAuditsResults.forEach(({ status, warningDetails }) => {
                const dimensions: SimpleMap<string> = {
                    type: 'address',
                    result: status === AddressAuditStatus.Warning ? 'warning' : 'failure',
                    reason: getWarningReason(warningDetails),
                };

                reports.push({
                    ...group,
                    dimensions,
                });
            });
            failedLocalStorageAuditsOwn.forEach(() => {
                const dimensions: SimpleMap<string> = {
                    type: 'local_storage_own_keys',
                    result: 'failure',
                    reason: 'local_key_changes_not_applied',
                };

                reports.push({
                    ...group,
                    dimensions,
                });
            });
            failedLocalStorageAuditsOther.forEach(() => {
                const dimensions: SimpleMap<string> = {
                    type: 'local_storage_other_keys',
                    result: 'failure',
                    reason: 'past_keys_not_authentic',
                };

                reports.push({
                    ...group,
                    dimensions,
                });
            });

            void sendMultipleTelemetryReports({
                api: api,
                reports,
            });
        }
    };

    return reportSelfAuditErrors;
};

export default useReportSelfAuditErrors;
