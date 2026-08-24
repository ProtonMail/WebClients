import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { PaymentsContextProvider } from '@proton/payments/ui/context/PaymentContext';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';

import Loader from '../../../components/loader/Loader';
import useDashboardPaymentFlow from '../../../hooks/useDashboardPaymentFlow';
import useLoad from '../../../hooks/useLoad';
import { usePreferredPlansMap } from '../../../hooks/usePreferredPlansMap';
import SettingsSectionWide from '../../account/SettingsSectionWide';
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
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    const telemetryFlow = useDashboardPaymentFlow(app);

    useLoad();

    const { upsells, loading: upsellsLoading } = useUpsellsToDisplay({
        app,
        subscription,
        plansMap,
        freePlan,
        openSubscriptionModal,
        user,
        telemetryFlow,
        ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
    });

    const loading = loadingSubscription || loadingPlans || plansMapLoading || upsellsLoading;

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
