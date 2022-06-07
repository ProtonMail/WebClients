import { createContext, ReactNode, useContext, useRef } from 'react';
import { Audience, Currency, Cycle, PlanIDs } from '@proton/shared/lib/interfaces';
import { getHasB2BPlan, getHasLegacyPlans, getIsB2BPlan, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { toMap } from '@proton/shared/lib/helpers/object';
import { PLANS } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';

import { useModalState } from '../../../components';
import { usePlans, useSubscription, useUser } from '../../../hooks';

import { SUBSCRIPTION_STEPS } from './constants';
import SubscriptionModal from './SubscriptionModal';
import SubscriptionModalDisabled from './SubscriptionModalDisabled';
import { getCurrency } from './helpers';

interface OpenCallbackProps {
    step: SUBSCRIPTION_STEPS;
    defaultAudience?: Audience;
    plan?: PLANS;
    planIDs?: PlanIDs;
    cycle?: Cycle;
    currency?: Currency;
    coupon?: string;
    disablePlanSelection?: boolean;
    disableThanksStep?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
    fullscreen?: boolean;
}

export type OpenSubscriptionModalCallback = (props: OpenCallbackProps) => void;

type ContextProps = [OpenSubscriptionModalCallback, boolean];

const SubscriptionModalContext = createContext<ContextProps>([noop, false]);

export const useSubscriptionModal = () => {
    return useContext(SubscriptionModalContext);
};

interface Props {
    children: ReactNode;
}

const SubscriptionModalProvider = ({ children }: Props) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [user] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const subscriptionProps = useRef<{
        planIDs: PlanIDs;
        defaultAudience?: Audience;
        step: SUBSCRIPTION_STEPS;
        currency?: Currency;
        cycle?: Cycle;
        coupon?: string;
        disablePlanSelection?: boolean;
        disableThanksStep?: boolean;
        onClose?: () => void;
        onSuccess?: () => void;
        fullscreen?: boolean;
    } | null>(null);
    const [modalState, setModalState, render] = useModalState({ onClose: subscriptionProps?.current?.onClose });

    const loading = Boolean(loadingSubscription || loadingPlans);

    const plansMap = toMap(plans, 'Name');
    const subscriptionPlanIDs = getPlanIDs(subscription);

    return (
        <>
            {render &&
                subscriptionProps.current &&
                (getHasLegacyPlans(subscription) ? (
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
                        disablePlanSelection,
                        disableThanksStep,
                        onClose,
                        onSuccess,
                        fullscreen,
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
                            currency: currency || getCurrency(user, subscription, plans),
                            cycle: cycle || subscription.Cycle,
                            coupon: coupon || subscription.CouponCode || undefined,
                            defaultAudience:
                                defaultAudience || (plan && getIsB2BPlan(plan)) || getHasB2BPlan(subscription)
                                    ? Audience.B2B
                                    : Audience.B2C,
                            disablePlanSelection,
                            disableThanksStep,
                            onClose,
                            onSuccess,
                            fullscreen,
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
