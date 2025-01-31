import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import useAppLink from '@proton/components/components/link/useAppLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';
import useLoad from '@proton/components/hooks/useLoad';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import type { PLANS } from '@proton/payments';
import {
    CURRENCIES,
    type Currency,
    DEFAULT_CYCLE,
    type PaymentMethodStatusExtended,
    SelectedPlan,
    getPlansMap,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { getPlanName, getValidCycle } from '@proton/shared/lib/helpers/subscription';
import type { Plan, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { Eligibility, PlanCombination } from './subscriptionEligbility';
import { getEligibility } from './subscriptionEligbility';

const getParameters = (
    search: string,
    plans: Plan[],
    subscription: Subscription,
    user: UserModel,
    getPreferredCurrency: ReturnType<typeof useCurrencies>['getPreferredCurrency'],
    paymentStatus: PaymentMethodStatusExtended
) => {
    const params = new URLSearchParams(search);

    const planName = params.get('plan') || '';
    const coupon = params.get('coupon') || undefined;
    const cycleParam = parseInt(params.get('cycle') as any, 10);
    const currencyParam = params.get('currency')?.toUpperCase();
    const target = params.get('target');
    const edit = params.get('edit');
    const type = params.get('type');
    const offer = params.get('offer');
    const addon = params.get('addon');

    const parsedTarget = (() => {
        if (target === 'compare') {
            return SUBSCRIPTION_STEPS.PLAN_SELECTION;
        }
        if (target === 'checkout') {
            return SUBSCRIPTION_STEPS.CHECKOUT;
        }
    })();

    const parsedCycle = cycleParam && getValidCycle(cycleParam);

    const parsedCurrency =
        currencyParam && CURRENCIES.includes(currencyParam as any) ? (currencyParam as Currency) : undefined;

    const plansMap = getPlansMap(
        plans,
        getPreferredCurrency({
            paramCurrency: parsedCurrency,
            user,
            subscription,
            plans,
            status: paymentStatus,
        }),
        true
    );

    let plan = plansMap?.[planName as PLANS];

    if (!plan && addon === 'lumo') {
        plan = plansMap?.[getPlanName(subscription) as PLANS];
    }

    return {
        plan,
        coupon,
        cycle: parsedCycle || subscription?.Cycle || DEFAULT_CYCLE,
        currency: parsedCurrency,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: type === 'offer' || edit === 'disable' || addon === 'lumo',
        disableCycleSelector: edit === 'enable' ? false : type === 'offer' || addon === 'lumo' || Boolean(offer),
        plansMap,
        addon,
    };
};

interface Props extends ModalProps {
    discount: number;
    planCombination: PlanCombination;
    onConfirm: () => void;
}

const PromotionAppliedPrompt = (rest: ModalProps) => {
    return (
        <Prompt
            title={c('Info').t`Your account was successfully updated with this promotion`}
            buttons={[
                <Button color="norm" onClick={rest.onClose}>
                    {c('bf2023: Action').t`Close`}
                </Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Thanks for supporting our mission to build a better internet where privacy and freedom come first.`}
        </Prompt>
    );
};

const UnavailablePrompt = (rest: ModalProps) => {
    return (
        <Prompt
            title={c('bf2023: Title').t`Offer unavailable`}
            buttons={[<Button onClick={rest.onClose}>{c('bf2023: Action').t`Close`}</Button>]}
            {...rest}
        >
            {getBoldFormattedText(c('bf2023: info').t`Sorry, this offer is not available with your current plan.`)}
        </Prompt>
    );
};

const UpsellPrompt = ({ discount, planCombination: { plan, cycle }, onConfirm, ...rest }: Props) => {
    const discountPercentage = `${discount}%`;
    return (
        <Prompt
            title={c('bf2023: Title').t`Offer unavailable`}
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        onConfirm();
                        rest.onClose?.();
                    }}
                >
                    {c('bf2023: Action').t`Get the deal`}
                </Button>,
                <Button onClick={rest.onClose}>{c('bf2023: Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('bf2023: info').ngettext(
                msgid`Sorry, this offer is not available with your current plan. But you can get ${discountPercentage} off ${plan.Title} when you subscribe for ${cycle} month.`,
                `Sorry, this offer is not available with your current plan. But you can get ${discountPercentage} off ${plan.Title} when you subscribe for ${cycle} months.`,
                cycle
            )}
        </Prompt>
    );
};

const AutomaticSubscriptionModal = () => {
    const history = useHistory();
    const location = useLocation();
    //const protonConfig = useConfig();

    const [openSubscriptionModal, loadingModal] = useSubscriptionModal();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscription, loadingSubscription] = useSubscription();
    const [, loadingLastSubscriptionEnd] = useLastSubscriptionEnd();
    const [user] = useUser();
    const tmpProps = useRef<{ props: OpenCallbackProps; eligibility: Eligibility } | undefined>(undefined);
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const [unavailableModalProps, setUnavailableModal, renderUnavailableModal] = useModalState();
    const [promotionAppliedProps, setPromotionAppliedModal, renderPromotionAppliedModal] = useModalState();
    const { getPreferredCurrency } = useCurrencies();
    const [, loadingCurrency] = useAutomaticCurrency();
    const [paymentStatus, loadingPaymentStatus] = usePaymentStatus();

    const goToApp = useAppLink();

    useLoad();

    useEffect(() => {
        if (
            !plans ||
            !subscription ||
            loadingPlans ||
            loadingSubscription ||
            loadingModal ||
            loadingLastSubscriptionEnd ||
            loadingPaymentStatus ||
            loadingCurrency ||
            !paymentStatus
        ) {
            return;
        }

        const { plan, currency, cycle, coupon, step, disablePlanSelection, disableCycleSelector, plansMap, addon } =
            getParameters(location.search, plans, subscription, user, getPreferredCurrency, paymentStatus);

        if (!plan) {
            return;
        }

        /*const options = {
            subscription,
            protonConfig,
            user,
            lastSubscriptionEnd,
            preferredCurrency,
        };*/
        const eligibleBlackFridayConfigs = [].filter(isTruthy);

        const eligibility = getEligibility({
            plansMap,
            offer: {
                plan,
                cycle,
                coupon,
            },
            subscription,
            user,
            eligibleBlackFridayConfigs,
        });

        history.replace({ search: undefined });

        const openProps: OpenCallbackProps = {
            plan: plan.Name as PLANS,
            currency,
            cycle,
            coupon,
            step,
            disablePlanSelection,
            disableCycleSelector,
            metrics: {
                source: 'automatic',
            },
        };

        if (eligibility.type === 'bf-applied') {
            setPromotionAppliedModal(true);
            return;
        }

        if (eligibility.type === 'not-eligible') {
            setUnavailableModal(true);
            return;
        }

        if (eligibility.type === 'upsell') {
            const { plan, coupon, cycle } = eligibility.planCombination;
            tmpProps.current = {
                props: {
                    ...openProps,
                    plan: plan.Name as PLANS,
                    cycle,
                    coupon,
                },
                eligibility,
            };
            setUpsellModal(true);
            return;
        }

        if (eligibility.type === 'pass-through') {
            if (addon === 'lumo') {
                const selectedPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

                // Default number of lumo addons to the total number of members
                openProps.planIDs = selectedPlan.setLumoCount(selectedPlan.getTotalUsers()).planIDs;

                openProps.plan = undefined; // We need to use maybePlanIDs when calculating planIDs in SubscriptionContainer
                openProps.onSubscribed = () => {
                    goToApp('/', APPS.PROTONLUMO, false);
                };
            }
            openSubscriptionModal(openProps);
        }
    }, [loadingPlans, loadingSubscription, loadingModal, loadingLastSubscriptionEnd, location.search]);

    const tmp = tmpProps.current;

    return (
        <>
            {renderPromotionAppliedModal && <PromotionAppliedPrompt {...promotionAppliedProps} />}
            {renderUnavailableModal && <UnavailablePrompt {...unavailableModalProps} />}
            {renderUpsellModal && tmp && tmp.eligibility.type === 'upsell' && (
                <UpsellPrompt
                    discount={tmp.eligibility.discount}
                    planCombination={tmp.eligibility.planCombination}
                    {...upsellModalProps}
                    onConfirm={() => {
                        if (tmp.props) {
                            openSubscriptionModal(tmp.props);
                        }
                    }}
                />
            )}
        </>
    );
};

export default AutomaticSubscriptionModal;
