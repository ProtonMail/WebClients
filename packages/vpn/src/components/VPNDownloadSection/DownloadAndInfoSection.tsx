import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import { getDownloadAppText } from '@proton/components/containers/account/dashboard/shared/DashboardMoreInfoSection/helpers';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getTelemetryUserTier } from '@proton/components/helpers/getTelemetryUserTier';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasAnyPlusWithoutVPN, hasFree } from '@proton/payments/core/subscription/helpers';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { VPN_APP_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import { DownloadSection } from './DownloadSection';
import { GetMoreSection } from './GetMoreSection';

export const VPNDownloadAndInfoSection = ({ app }: { app: APP_NAMES }) => {
    const api = useApi();
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const plan = hasAnyPlusWithoutVPN(subscription) ? PLANS.BUNDLE : PLANS.VPN2024;

    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            telemetryFlow,
            onMount: () => {
                void sendTelemetryReport({
                    api,
                    delay: false,
                    event: TelemetryAccountDashboardEvents.upgradeButtonClick,
                    measurementGroup: TelemetryMeasurementGroups.accountDashboard,
                    dimensions: {
                        app,
                        billing_cycle: subscription?.Cycle?.toString() ?? undefined,
                        user_tier: getTelemetryUserTier(user),
                    },
                });
            },
        });
    };

    if (loadingSubscription) {
        return <Loader />;
    }

    const upgradeButton = (
        <Button
            size="small"
            shape="underline"
            color="norm"
            onClick={handleExplorePlans}
            loading={loadingSubscriptionModal}
            data-testid="cta:upgrade-plan"
            key="upgrade-button"
        >
            {c('specialoffer: Link').t`Upgrade`}
        </Button>
    );

    let downloadsSubtitle: ReactNode;
    if (user.canPay) {
        const vpnPlusOrUnlimited = PLAN_NAMES[plan];
        downloadsSubtitle =
            hasFree(subscription) || hasAnyPlusWithoutVPN(subscription)
                ? c('Title')
                      .jt`Connect to ${VPN_CONNECTIONS} devices at once with ${vpnPlusOrUnlimited}. ${upgradeButton}`
                : c('Title').t`Start protecting your devices with the ${VPN_APP_NAME} app.`;
    }

    return (
        <DashboardGrid columns={2}>
            <DashboardGridSection position="header-left">
                <DashboardGridSectionHeader title={getDownloadAppText(VPN_APP_NAME)} subtitle={downloadsSubtitle} />
            </DashboardGridSection>
            <DashboardGridSection position="content-left">
                <DownloadSection />
            </DashboardGridSection>
            <DashboardGridSection position="header-right">
                <DashboardGridSectionHeader title={c('Title').t`Get more from your VPN`} />
            </DashboardGridSection>
            <DashboardGridSection position="content-right">
                <GetMoreSection />
            </DashboardGridSection>
        </DashboardGrid>
    );
};
