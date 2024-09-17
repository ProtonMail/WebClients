import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps, OpenCallbackProps } from '@proton/components';
import {
    useConfig,
    useLastSubscriptionEnd,
    useLoad,
    useModalState,
    usePaymentStatus,
    usePlans,
    useSubscription,
    useSubscriptionModal,
    useUser,
} from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import {
    blackFriday2023DriveFreeConfig,
    blackFriday2023DriveFreeEligibility,
} from '@proton/components/containers/offers/operations/blackFridayDrive2023Free';
import {
    blackFriday2023DrivePlusConfig,
    blackFriday2023DrivePlusEligibility,
} from '@proton/components/containers/offers/operations/blackFridayDrive2023Plus';
import {
    blackFriday2023DriveUnlimitedConfig,
    blackFriday2023DriveUnlimitedEligibility,
} from '@proton/components/containers/offers/operations/blackFridayDrive2023Unlimited';
import {
    blackFriday2023InboxFreeConfig,
    blackFriday2023InboxFreeEligibility,
} from '@proton/components/containers/offers/operations/blackFridayInbox2023Free';
import {
    blackFriday2023InboxMailConfig,
    blackFriday2023InboxMailEligibility,
} from '@proton/components/containers/offers/operations/blackFridayInbox2023Plus';
import {
    blackFriday2023InboxUnlimitedConfig,
    blackFriday2023InboxUnlimitedEligibility,
} from '@proton/components/containers/offers/operations/blackFridayInbox2023Unlimited';
import {
    blackFriday2023VPNFreeConfig,
    blackFriday2023VPNFreeEligibility,
} from '@proton/components/containers/offers/operations/blackFridayVPN2023Free';
import {
    blackFriday2023VPNMonthlyConfig,
    blackFriday2023VPNMonthlyEligibility,
} from '@proton/components/containers/offers/operations/blackFridayVPN2023Monthly';
import {
    blackFriday2023VPNTwoYearsConfig,
    blackFriday2023VPNTwoYearsEligibility,
} from '@proton/components/containers/offers/operations/blackFridayVPN2023TwoYears';
import {
    blackFriday2023VPNYearlyConfig,
    blackFriday2023VPNYearlyEligibility,
} from '@proton/components/containers/offers/operations/blackFridayVPN2023Yearly';
import { getMonths } from '@proton/components/containers/payments/SubscriptionsSection';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { type PaymentMethodStatusExtended, getPlansMap } from '@proton/payments';
import type { PLANS } from '@proton/shared/lib/constants';
import { CURRENCIES, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { getValidCycle } from '@proton/shared/lib/helpers/subscription';
import type { Currency, Plan, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { Eligibility, PlanCombinationWithDiscount } from './subscriptionEligbility';
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
    const plan = plansMap?.[planName as PLANS];

    return {
        plan,
        coupon,
        cycle: parsedCycle || subscription?.Cycle || DEFAULT_CYCLE,
        // todo: add status
        currency: parsedCurrency,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: type === 'offer' || edit === 'disable',
        disableCycleSelector: edit === 'enable' ? false : type === 'offer' || Boolean(offer),
        plansMap,
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
    const protonConfig = useConfig();

    const [open, loadingModal] = useSubscriptionModal();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscription, loadingSubscription] = useSubscription();
    const [lastSubscriptionEnd, loadingLastSubscriptionEnd] = useLastSubscriptionEnd();
    const [user] = useUser();
    const tmpProps = useRef<{ props: OpenCallbackProps; eligibility: Eligibility } | undefined>(undefined);
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const [unavailableModalProps, setUnavailableModal, renderUnavailableModal] = useModalState();
    const [promotionAppliedProps, setPromotionAppliedModal, renderPromotionAppliedModal] = useModalState();
    const { getPreferredCurrency } = useCurrencies();
    const [paymentStatus, loadingPaymentStatus] = usePaymentStatus();

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
            !paymentStatus
        ) {
            return;
        }

        const { plan, currency, cycle, coupon, step, disablePlanSelection, disableCycleSelector, plansMap } =
            getParameters(location.search, plans, subscription, user, getPreferredCurrency, paymentStatus);

        if (!plan) {
            return;
        }

        const options = {
            subscription,
            protonConfig,
            user,
            lastSubscriptionEnd,
        };
        const eligibleBlackFridayConfigs = [
            blackFriday2023InboxFreeEligibility(options) && blackFriday2023InboxFreeConfig,
            blackFriday2023InboxMailEligibility(options) && blackFriday2023InboxMailConfig,
            blackFriday2023InboxUnlimitedEligibility(options) && blackFriday2023InboxUnlimitedConfig,
            blackFriday2023VPNFreeEligibility(options) && blackFriday2023VPNFreeConfig,
            blackFriday2023VPNMonthlyEligibility(options) && blackFriday2023VPNMonthlyConfig,
            blackFriday2023VPNYearlyEligibility(options) && blackFriday2023VPNYearlyConfig,
            blackFriday2023VPNTwoYearsEligibility(options) && blackFriday2023VPNTwoYearsConfig,
            blackFriday2023DriveFreeEligibility(options) && blackFriday2023DriveFreeConfig,
            blackFriday2023DrivePlusEligibility(options) && blackFriday2023DrivePlusConfig,
            blackFriday2023DriveUnlimitedEligibility(options) && blackFriday2023DriveUnlimitedConfig,
        ].filter(isTruthy);

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
    }, [loadingPlans, loadingSubscription, loadingModal, loadingLastSubscriptionEnd, location.search]);

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
