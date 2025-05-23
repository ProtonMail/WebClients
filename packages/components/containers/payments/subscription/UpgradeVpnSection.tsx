import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import useLoad from '@proton/components/hooks/useLoad';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { FREE_PLAN } from '@proton/payments';
import { PaymentsContextProvider } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';

import { useSubscriptionModal } from './SubscriptionModalProvider';
import { useUpsellsToDisplay } from './helpers';
import { UpsellPanels } from './panels';

import './YourPlanSection.scss';

interface Props {
    app: APP_NAMES;
}

const UpgradeVpnSectionInner = ({ app }: Props) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const [serversCount, serversCountLoading] = useVPNServersCount();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    const telemetryFlow = useDashboardPaymentFlow(app);

    useLoad();

    const { upsells, loading: upsellsLoading } = useUpsellsToDisplay({
        app,
        subscription,
        plansMap,
        freePlan,
        serversCount,
        openSubscriptionModal,
        user,
        telemetryFlow,
        ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
    });

    const loading = loadingSubscription || loadingPlans || serversCountLoading || plansMapLoading || upsellsLoading;

    if (!subscription || loading) {
        return <Loader />;
    }

    return (
        <SettingsSectionWide>
            <div className="grid-column-2 your-plan-section-container gap-8 pt-4" data-testid="vpn-upsell-panels">
                <UpsellPanels upsells={upsells} subscription={subscription} />
            </div>
        </SettingsSectionWide>
    );
};

const UpgradeVpnSection = (props: Props) => {
    return (
        <PaymentsContextProvider>
            <UpgradeVpnSectionInner {...props} />
        </PaymentsContextProvider>
    );
};

export default UpgradeVpnSection;
