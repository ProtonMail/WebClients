import { useCallback } from 'react';

import { organizationThunk } from '@proton/account/organization';
import { subscriptionThunk } from '@proton/account/subscription';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { TelemetryMeasurementGroups, TelemetryVpnB2bUserActivityEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import noop from '@proton/utils/noop';

import useApi from '../../../hooks/useApi';

const ORGANIZATION_SIZE_BUCKETS = [
    { max: 9, label: '1-9' },
    { max: 49, label: '10-49' },
    { max: 249, label: '50-249' },
] as const;

const getOrganizationSizeBucket = (usedMembers: number | undefined) => {
    if (usedMembers === undefined) {
        return 'n/a';
    }
    return ORGANIZATION_SIZE_BUCKETS.find(({ max }) => usedMembers <= max)?.label ?? '250+';
};

const useUserActivityTelemetry = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const report = useCallback(
        (event: TelemetryVpnB2bUserActivityEvents) => {
            const run = async () => {
                const [organization, subscription] = await Promise.all([
                    dispatch(organizationThunk()),
                    dispatch(subscriptionThunk()),
                ]);

                await sendTelemetryReport({
                    api,
                    measurementGroup: TelemetryMeasurementGroups.vpnB2bUserActivity,
                    event,
                    dimensions: {
                        organization_size: getOrganizationSizeBucket(organization?.UsedMembers),
                        plan: getPlanName(subscription) ?? 'n/a',
                    },
                    delay: false,
                });
            };

            void run().catch(noop);
        },
        [api, dispatch]
    );

    const trackConnectionUpsellShown = useCallback(
        () => report(TelemetryVpnB2bUserActivityEvents.upsell_shown),
        [report]
    );

    const trackConnectionUpsellLearnMoreClicked = useCallback(
        () => report(TelemetryVpnB2bUserActivityEvents.upsell_learn_more_clicked),
        [report]
    );

    const trackConnectionUpsellUpgradeStarted = useCallback(
        () => report(TelemetryVpnB2bUserActivityEvents.upsell_upgrade_started),
        [report]
    );

    const trackConnectionUpsellUpgradeSuccess = useCallback(
        () => report(TelemetryVpnB2bUserActivityEvents.upsell_upgrade_success),
        [report]
    );

    const trackGatewayMonitorEnableClicked = useCallback(
        () => report(TelemetryVpnB2bUserActivityEvents.enable_clicked),
        [report]
    );

    return {
        trackConnectionUpsellShown,
        trackConnectionUpsellLearnMoreClicked,
        trackConnectionUpsellUpgradeStarted,
        trackConnectionUpsellUpgradeSuccess,
        trackGatewayMonitorEnableClicked,
    };
};

export default useUserActivityTelemetry;
