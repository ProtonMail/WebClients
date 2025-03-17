import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button, DashboardGrid, DashboardGridSection, DashboardGridSectionHeader } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { VPN_APP_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';

import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';
import VpnDownloadSection from '../VpnDownloadSection/VpnDownloadSection';
import VpnGetMoreSection from '../VpnGetMoreSection/VpnGetMoreSection';

export const VpnDownloadAndInfoSection = ({ app }: { app: APP_NAMES }) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const plan = PLANS.VPN2024;

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
        <Button size="small" shape="underline" color="norm" onClick={handleExplorePlans} data-testid="cta:upgrade-plan">
            {c('specialoffer: Link').t`Upgrade`}
        </Button>
    );

    const vpnPlus = PLAN_NAMES[plan];
    const downloadsSubtitle = !subscription?.Plans
        ? c('Title').jt`Connect to ${VPN_CONNECTIONS} devices at once with ${vpnPlus}. ${upgradeButton}`
        : c('Title').t`Get the app on all your devices and protect up to ${VPN_CONNECTIONS} at one time.`;

    return (
        <DashboardGrid columns={2}>
            <DashboardGridSection position="header-left">
                <DashboardGridSectionHeader
                    title={c('Title').t`Download ${VPN_APP_NAME}`}
                    subtitle={downloadsSubtitle}
                />
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
