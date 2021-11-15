import { createContext, ReactNode, useContext, useRef } from 'react';
import { Audience, Currency, Cycle, PlanIDs } from '@proton/shared/lib/interfaces';
import { getHasB2BPlan, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { toMap } from '@proton/shared/lib/helpers/object';
import { PLANS } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';

import { useModalState } from '../../../components';
import { useFeature, usePlans, useSubscription } from '../../../hooks';
import { FeatureCode } from '../../features';

import { SUBSCRIPTION_STEPS } from './constants';
import SubscriptionModal from './SubscriptionModal';
import SubscriptionModalDisabled from './SubscriptionModalDisabled';

interface OpenCallbackProps {
    step: SUBSCRIPTION_STEPS;
    defaultAudience?: Audience;
    plan?: PLANS;
    planIDs?: PlanIDs;
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
    const [plans = [], loadingPlans] = usePlans();
    const paymentsDisabledFeature = useFeature(FeatureCode.PaymentsDisabled);
    const [modalState, setModalState, render] = useModalState();
    const subscriptionProps = useRef<{
        planIDs: PlanIDs;
        defaultAudience?: Audience;
        step: SUBSCRIPTION_STEPS;
        currency?: Currency;
        cycle?: Cycle;
        coupon?: string;
        disableBackButton?: boolean;
    } | null>(null);

    const loading = Boolean(loadingSubscription || loadingPlans || paymentsDisabledFeature.loading);

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
                        currency,
                        cycle,
                        coupon,
                        defaultAudience,
                        disableBackButton,
                    }) => {
                        if (loading || render) {
                            return;
                        }
                        subscriptionProps.current = {
                            planIDs: plan
                                ? switchPlan({
                                      planIDs: subscriptionPlanIDs,
                                      planID: plansMap[plan].Name,
                                  })
                                : maybePlanIDs || subscriptionPlanIDs,
                            step,
                            currency: currency || subscription.Currency,
                            cycle: cycle || subscription.Cycle,
                            coupon: coupon || subscription.CouponCode || undefined,
                            defaultAudience:
                                defaultAudience || getHasB2BPlan(subscription) ? Audience.B2B : Audience.B2C,
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
