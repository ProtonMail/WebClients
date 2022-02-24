import { createContext, ReactNode, useContext, useRef } from 'react';
import { Currency, Cycle, PlanIDs } from '@proton/shared/lib/interfaces';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { toMap } from '@proton/shared/lib/helpers/object';
import { PLAN_SERVICES, PLANS } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';

import { useModalState } from '../../../components';
import { useFeature, useOrganization, usePlans, useSubscription } from '../../../hooks';
import { FeatureCode } from '../../features';

import { SUBSCRIPTION_STEPS } from './constants';
import SubscriptionModal from './SubscriptionModal';
import SubscriptionModalDisabled from './SubscriptionModalDisabled';

interface OpenCallbackProps {
    step: SUBSCRIPTION_STEPS;
    plan?: PLANS;
    planIDs?: PlanIDs;
    service?: PLAN_SERVICES;
    cycle?: Cycle;
    currency?: Currency;
    coupon?: string;
    disableBackButton?: boolean;
}

type OpenCallback = (props: OpenCallbackProps) => void;

type ContextProps = [OpenCallback, boolean];

const SubscriptionModalContext = createContext<ContextProps>([noop, false]);

export const useSubscriptionModal = () => {
    return useContext(SubscriptionModalContext);
};

interface Props {
    children: ReactNode;
}

const SubscriptionModalProvider = ({ children }: Props) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganisation] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const paymentsDisabledFeature = useFeature(FeatureCode.PaymentsDisabled);
    const [modalState, setModalState, render] = useModalState();
    const subscriptionProps = useRef<{
        planIDs: PlanIDs;
        step: SUBSCRIPTION_STEPS;
        currency?: Currency;
        cycle?: Cycle;
        coupon?: string;
        disableBackButton?: boolean;
    } | null>(null);

    const loading = Boolean(
        loadingOrganisation || loadingSubscription || loadingPlans || paymentsDisabledFeature.loading
    );

    const plansMap = toMap(plans, 'Name');
    const subscriptionPlanIDs = getPlanIDs(subscription);

    return (
        <>
            {render &&
                subscriptionProps.current &&
                (paymentsDisabledFeature.feature?.Value === true ? (
                    <SubscriptionModalDisabled {...modalState} />
                ) : (
                    <SubscriptionModal {...subscriptionProps.current} {...modalState} />
                ))}
            <SubscriptionModalContext.Provider
                value={[
                    ({
                        planIDs: maybePlanIDs,
                        plan,
                        step,
                        service = PLAN_SERVICES.MAIL,
                        currency,
                        cycle,
                        coupon,
                        disableBackButton,
                    }) => {
                        if (loading || render) {
                            return;
                        }
                        subscriptionProps.current = {
                            planIDs: plan
                                ? switchPlan({
                                      planIDs: subscriptionPlanIDs,
                                      plans,
                                      planID: plansMap[plan].ID,
                                      service,
                                      organization,
                                  })
                                : maybePlanIDs || subscriptionPlanIDs,
                            step,
                            currency: currency || subscription.Currency,
                            cycle: cycle || subscription.Cycle,
                            coupon: coupon || subscription.CouponCode || undefined,
                            disableBackButton,
                        };
                        setModalState(true);
                    },
                    loading,
                ]}
            >
                {children}
            </SubscriptionModalContext.Provider>
        </>
    );
};

export default SubscriptionModalProvider;
