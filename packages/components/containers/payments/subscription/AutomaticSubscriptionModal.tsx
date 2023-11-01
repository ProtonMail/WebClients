import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    ModalProps,
    OpenCallbackProps,
    Prompt,
    useLoad,
    useModalState,
    usePlans,
    useSubscription,
    useSubscriptionModal,
    useUser,
} from '@proton/components';
import { getMonths } from '@proton/components/containers/payments/SubscriptionsSection';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { CURRENCIES, DEFAULT_CYCLE, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getValidCycle } from '@proton/shared/lib/helpers/subscription';
import { Currency, Plan, PlansMap, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import useOfferConfig from '../../offers/hooks/useOfferConfig';
import { getCurrency } from './helpers';
import { Eligibility, PlanCombinationWithDiscount, getEligibility } from './subscriptionEligbility';

const getParameters = (
    search: string,
    plansMap: PlansMap,
    plans: Plan[],
    subscription: Subscription,
    user: UserModel
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

    const plan = plansMap?.[planName as PLANS];

    return {
        plan,
        coupon,
        cycle: parsedCycle || subscription?.Cycle || DEFAULT_CYCLE,
        currency: parsedCurrency || getCurrency(user, subscription, plans),
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: type === 'offer' || edit === 'disable',
        disableCycleSelector: edit === 'enable' ? false : type === 'offer' || Boolean(offer),
    };
};

interface Props extends ModalProps {
    planCombination: PlanCombinationWithDiscount;
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

const UpsellPrompt = ({ planCombination: { discount, plan, cycle }, onConfirm, ...rest }: Props) => {
    const months = getMonths(cycle);
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
            {getBoldFormattedText(
                c('bf2023: info')
                    .t`Sorry, this offer is not available with your current plan. But you can get **${discountPercentage} off ${plan.Title}** when you subscribe for **${months}**.`
            )}
        </Prompt>
    );
};

const AutomaticSubscriptionModal = () => {
    const history = useHistory();
    const location = useLocation();

    const [offerConfig, loadingOffer] = useOfferConfig();

    const [open, loadingModal] = useSubscriptionModal();
    const [plans, loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [user] = useUser();
    const tmpProps = useRef<{ props: OpenCallbackProps; eligibility: Eligibility } | undefined>(undefined);
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const [unavailableModalProps, setUnavailableModal, renderUnavailableModal] = useModalState();
    const [promotionAppliedProps, setPromotionAppliedModal, renderPromotionAppliedModal] = useModalState();

    useLoad();

    useEffect(() => {
        if (!plans || !subscription || loadingPlans || loadingSubscription || loadingModal || loadingOffer) {
            return;
        }

        const plansMap = toMap(plans, 'Name') as PlansMap;

        const { plan, currency, cycle, coupon, step, disablePlanSelection, disableCycleSelector } = getParameters(
            location.search,
            plansMap,
            plans,
            subscription,
            user
        );
        if (!plan) {
            return;
        }

        const eligibility = getEligibility({
            plansMap,
            offer: {
                plan,
                cycle,
                coupon,
            },
            subscription,
            user,
            offerConfig,
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
            tmpProps.current = {
                props: {
                    ...openProps,
                    plan: eligibility.planCombination.plan.Name as PLANS,
                    cycle: eligibility.planCombination.cycle,
                },
                eligibility,
            };
            setUpsellModal(true);
            return;
        }

        if (eligibility.type === 'pass-through') {
            open(openProps);
        }
    }, [loadingPlans, loadingSubscription, loadingModal, loadingOffer, location.search]);

    const tmp = tmpProps.current;

    return (
        <>
            {renderPromotionAppliedModal && <PromotionAppliedPrompt {...promotionAppliedProps} />}
            {renderUnavailableModal && <UnavailablePrompt {...unavailableModalProps} />}
            {renderUpsellModal && tmp && tmp.eligibility.type === 'upsell' && (
                <UpsellPrompt
                    planCombination={tmp.eligibility.planCombination}
                    {...upsellModalProps}
                    onConfirm={() => {
                        if (tmp.props) {
                            open(tmp.props);
                        }
                    }}
                />
            )}
        </>
    );
};

export default AutomaticSubscriptionModal;
