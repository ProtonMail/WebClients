import { hasVpnBasic, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE, PLAN_SERVICES, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { c } from 'ttag';
import { Loader, Button, Card } from '../../../components';
import { useUser, useSubscription, useModals, usePlans, useOrganization } from '../../../hooks';
import SubscriptionModal from './SubscriptionModal';
import { SUBSCRIPTION_STEPS } from './constants';
import UpsellItem from './UpsellItem';

const UpsellVPNSubscription = () => {
    const [{ hasPaidVpn }, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const { Currency = DEFAULT_CURRENCY, Cycle = DEFAULT_CYCLE } = subscription || {};
    const isFreeVpn = !hasPaidVpn;
    const { createModal } = useModals();
    const plansMap = toMap(plans, 'Name');
    const planIDs = getPlanIDs(subscription);

    const handleUpgradeClick = () => {
        createModal(
            <SubscriptionModal
                currency={Currency}
                cycle={Cycle}
                planIDs={switchPlan({
                    planIDs,
                    plans,
                    planID: plansMap[PLANS.VPNPLUS].ID,
                    service: PLAN_SERVICES.MAIL,
                    organization,
                })}
                step={SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );
    };

    if (loadingUser || loadingSubscription || loadingPlans || loadingOrganization) {
        return <Loader />;
    }

    if (!isFreeVpn && !hasVpnBasic(subscription)) {
        return null;
    }

    return (
        <Card rounded bordered={false} className="mt1-5">
            <UpsellItem icon="rocket">{c('VPN upsell feature').t`Higher speed servers (up to 10Gbps)`}</UpsellItem>
            <UpsellItem icon="tour">
                {c('VPN upsell feature').t`Access geo-blocked content (Netflix, YouTube, etc.)`}
            </UpsellItem>
            <UpsellItem icon="protonvpn">{c('VPN upsell feature').t`Unlock advanced VPN features`}</UpsellItem>
            <Button color="norm" className="mt1" onClick={handleUpgradeClick}>
                {c('Action').t`Upgrade to Plus`}
            </Button>
        </Card>
    );
};

export default UpsellVPNSubscription;
