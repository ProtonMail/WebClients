import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useLoad from '@proton/components/hooks/useLoad';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import useFlag from '@proton/unleash/useFlag';

import { usePlans, usePreferredPlansMap, useSubscription, useVPNServersCount } from '../../../hooks';
import { useSubscriptionModal } from './SubscriptionModalProvider';
import { resolveUpsellsToDisplay } from './helpers';
import { UpsellPanels } from './panels';

import './YourPlanSection.scss';

interface Props {
    app: APP_NAMES;
}

const UpgradeVpnSection = ({ app }: Props) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const [serversCount, serversCountLoading] = useVPNServersCount();
    const { plansMap } = usePreferredPlansMap();

    const showBundleUpsellFromVPNBiz = useFlag('ShowBundleUpsellFromVPNBiz');

    useLoad();

    const loading = loadingSubscription || loadingPlans || serversCountLoading;

    if (!subscription || loading) {
        return <Loader />;
    }

    const upsells = resolveUpsellsToDisplay({
        app,
        subscription,
        plansMap,
        freePlan,
        serversCount,
        openSubscriptionModal,
        showBundleUpsellFromVPNBiz,
        ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
    });

    return (
        <SettingsSectionWide>
            <div className="grid-column-2 your-plan-section-container gap-8 pt-4" data-testid="vpn-upsell-panels">
                <UpsellPanels upsells={upsells} subscription={subscription} />
            </div>
        </SettingsSectionWide>
    );
};

export default UpgradeVpnSection;
