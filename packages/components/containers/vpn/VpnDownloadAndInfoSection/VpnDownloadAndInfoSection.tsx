import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { hasAnyPlusWithoutVPN, hasFree } from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { VPN_APP_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';

import { getDownloadAppText } from '../../account/dashboard/shared/DashboardMoreInfoSection/helpers';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';
import VpnDownloadSection from '../VpnDownloadSection/VpnDownloadSection';
import VpnGetMoreSection from '../VpnGetMoreSection/VpnGetMoreSection';

export const VpnDownloadAndInfoSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const plan = hasAnyPlusWithoutVPN(subscription) ? PLANS.BUNDLE : PLANS.VPN2024;

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
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
                <VpnDownloadSection />
            </DashboardGridSection>
            <DashboardGridSection position="header-right">
                <DashboardGridSectionHeader title={c('Title').t`Get more from your VPN`} />
            </DashboardGridSection>
            <DashboardGridSection position="content-right">
                <VpnGetMoreSection />
            </DashboardGridSection>
        </DashboardGrid>
    );
};

export default VpnDownloadAndInfoSection;
