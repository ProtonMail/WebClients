import { ReactNode, createContext, useContext, useRef } from 'react';

import { APP_NAMES, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import {
    getHasB2BPlan,
    getHasLegacyPlans,
    getIsB2BPlan,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
} from '@proton/shared/lib/helpers/subscription';
import { Audience, Currency, Cycle, PlanIDs } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useModalState } from '../../../components';
import { useOrganization, usePlans, useSubscription, useUser } from '../../../hooks';
import SubscriptionModal from './SubscriptionModal';
import SubscriptionModalDisabled from './SubscriptionModalDisabled';
import { SUBSCRIPTION_STEPS } from './constants';
import { SelectedProductPlans, getCurrency, getDefaultSelectedProductPlans } from './helpers';

interface OpenCallbackProps {
    step: SUBSCRIPTION_STEPS;
    defaultAudience?: Audience;
    defaultSelectedProductPlans?: SelectedProductPlans;
    plan?: PLANS;
    planIDs?: PlanIDs;
    cycle?: Cycle;
    currency?: Currency;
    coupon?: string;
    disablePlanSelection?: boolean;
    disableCycleSelector?: boolean;
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
    app: APP_NAMES;
    onClose?: () => void;
}

const SubscriptionModalProvider = ({ children, app, onClose }: Props) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [user] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const subscriptionProps = useRef<{
        planIDs: PlanIDs;
        defaultAudience?: Audience;
        defaultSelectedProductPlans: SelectedProductPlans;
        step: SUBSCRIPTION_STEPS;
        currency?: Currency;
        cycle?: Cycle;
        coupon?: string;
        disablePlanSelection?: boolean;
        disableCycleSelector?: boolean;
        disableThanksStep?: boolean;
        onClose?: () => void;
        onSuccess?: () => void;
        fullscreen?: boolean;
    } | null>(null);
    const [modalState, setModalState, render] = useModalState();

    const loading = Boolean(loadingSubscription || loadingPlans || loadingOrganization);

    const plansMap = toMap(plans, 'Name');
    const subscriptionPlanIDs = getPlanIDs(subscription);

    return (
        <>
            {render &&
                subscriptionProps.current &&
                (getHasLegacyPlans(subscription) ? (
                    <SubscriptionModalDisabled {...modalState} />
                ) : (
                    <SubscriptionModal
                        {...subscriptionProps.current}
                        {...modalState}
                        onClose={() => {
                            onClose?.();
                            subscriptionProps?.current?.onClose?.();
                            modalState.onClose();
                        }}
                    />
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
                        defaultSelectedProductPlans,
                        disablePlanSelection,
                        disableCycleSelector,
                        disableThanksStep,
                        onClose,
                        onSuccess,
                        fullscreen,
                    }) => {
                        if (loading || render) {
                            return;
                        }

                        // The 15 and 30 month cycle are only valid coming from the black friday modal.
                        // or Edit billing details.
                        const subscriptionCycle = disablePlanSelection
                            ? subscription.Cycle
                            : getNormalCycleFromCustomCycle(subscription.Cycle);

                        const planIDs = plan
                            ? switchPlan({
                                  planIDs: subscriptionPlanIDs,
                                  planID: plansMap[plan].Name,
                                  organization,
                                  plans,
                              })
                            : maybePlanIDs || subscriptionPlanIDs;

                        subscriptionProps.current = {
                            planIDs,
                            step,
                            currency: currency || getCurrency(user, subscription, plans),
                            cycle: cycle || subscriptionCycle,
                            coupon: coupon || subscription.CouponCode || undefined,
                            defaultAudience:
                                defaultAudience || (plan && getIsB2BPlan(plan)) || getHasB2BPlan(subscription)
                                    ? Audience.B2B
                                    : Audience.B2C,
                            defaultSelectedProductPlans:
                                defaultSelectedProductPlans || getDefaultSelectedProductPlans(app, planIDs),
                            disablePlanSelection,
                            disableCycleSelector,
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
