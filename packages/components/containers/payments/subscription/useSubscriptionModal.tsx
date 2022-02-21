import { DEFAULT_CURRENCY, DEFAULT_CYCLE, PLANS, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { useModals, useOrganization, usePlans, useSubscription } from '../../../hooks';
import { SUBSCRIPTION_STEPS } from './constants';
import SubscriptionModal from './SubscriptionModal';

const useSubscriptionModal = (
    service = PLAN_SERVICES.MAIL
): [(plan: PLANS, step?: SUBSCRIPTION_STEPS) => void, boolean] => {
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const { createModal } = useModals();
    const { Currency = DEFAULT_CURRENCY, Cycle = DEFAULT_CYCLE } = subscription || {};

    const showModal = (plan: PLANS, step?: SUBSCRIPTION_STEPS) => {
        const plansMap = toMap(plans, 'Name');
        const planIDs = getPlanIDs(subscription);

        createModal(
            <SubscriptionModal
                currency={Currency}
                cycle={Cycle}
                planIDs={switchPlan({
                    planIDs,
                    plans,
                    planID: plansMap[plan].ID,
                    service,
                    organization,
                })}
                step={step}
            />
        );
    };

    const loading = loadingSubscription || loadingPlans || loadingOrganization;

    return [showModal, loading];
};

export default useSubscriptionModal;
