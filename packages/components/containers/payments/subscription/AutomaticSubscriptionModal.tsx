import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getMonths } from '@proton/components/containers/payments/SubscriptionsSection';
import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { usePlans, useSubscription } from '@proton/components/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';
import useLoad from '@proton/components/hooks/useLoad';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { type PaymentMethodStatusExtended, getPlansMap } from '@proton/payments';
import type { PLANS } from '@proton/payments';
import { CURRENCIES, type Currency } from '@proton/payments';
import { DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { getValidCycle } from '@proton/shared/lib/helpers/subscription';
import type { Plan, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { blackFriday2024DuoConfig, blackFriday2024DuoEligibility } from '../../offers/operations/blackFriday2024Duo';
import { blackFriday2024PlusConfig, blackFriday2024PlusEligibility } from '../../offers/operations/blackFriday2024Plus';
import {
    blackFriday2024UnlimitedConfig,
    blackFriday2024UnlimitedEligibility,
} from '../../offers/operations/blackFriday2024Unlimited';
import {
    blackFriday2024DriveFreeConfig,
    blackFriday2024DriveFreeEligibility,
} from '../../offers/operations/blackFridayDrive2024Free';
import {
    blackFriday2024DriveFreeYearlyConfig,
    blackFriday2024DriveFreeYearlyEligibility,
} from '../../offers/operations/blackFridayDrive2024FreeYearly';
import {
    blackFriday2024InboxFreeConfig,
    blackFriday2024InboxFreeEligibility,
} from '../../offers/operations/blackFridayInbox2024Free';
import {
    blackFriday2024InboxFreeYearlyConfig,
    blackFriday2024InboxFreeYearlyEligibility,
} from '../../offers/operations/blackFridayInbox2024FreeYearly';
import {
    blackFriday2024PassFreeConfig,
    blackFriday2024PassFreeEligibility,
} from '../../offers/operations/blackFridayPass2024Free';
import {
    blackFriday2024PassPlusConfig,
    blackFriday2024PassPlusEligibility,
} from '../../offers/operations/blackFridayPass2024Plus';
import {
    blackFriday2024VPNFreeConfig,
    blackFriday2024VPNFreeEligibility,
} from '../../offers/operations/blackFridayVPN2024Free';
import {
    blackFriday2024VPNFreeYearlyConfig,
    blackFriday2024VPNFreeYearlyEligibility,
} from '../../offers/operations/blackFridayVPN2024FreeYearly';
import {
    blackFriday2024VPNMonthlyConfig,
    blackFriday2024VPNMonthlyEligibility,
} from '../../offers/operations/blackFridayVPN2024Monthly';
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
        currency: parsedCurrency,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: type === 'offer' || edit === 'disable',
        disableCycleSelector: edit === 'enable' ? false : type === 'offer' || Boolean(offer),
        plansMap,
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

    const [openSubscriptionModal, loadingModal] = useSubscriptionModal();
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
    const [preferredCurrency, loadingCurrency] = useAutomaticCurrency();
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
            loadingCurrency ||
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
            preferredCurrency,
        };
        const eligibleBlackFridayConfigs = [
            blackFriday2024InboxFreeEligibility(options) && blackFriday2024InboxFreeConfig,
            blackFriday2024DriveFreeEligibility(options) && blackFriday2024DriveFreeConfig,
            blackFriday2024VPNFreeEligibility(options) && blackFriday2024VPNFreeConfig,
            blackFriday2024InboxFreeYearlyEligibility(options) && blackFriday2024InboxFreeYearlyConfig,
            blackFriday2024DriveFreeYearlyEligibility(options) && blackFriday2024DriveFreeYearlyConfig,
            blackFriday2024VPNFreeYearlyEligibility(options) && blackFriday2024VPNFreeYearlyConfig,
            blackFriday2024PlusEligibility(options) && blackFriday2024PlusConfig,
            blackFriday2024VPNMonthlyEligibility(options) && blackFriday2024VPNMonthlyConfig,
            blackFriday2024UnlimitedEligibility(options) && blackFriday2024UnlimitedConfig,
            blackFriday2024DuoEligibility(options) && blackFriday2024DuoConfig,
            blackFriday2024PassPlusEligibility(options) && blackFriday2024PassPlusConfig,
            blackFriday2024PassFreeEligibility(options) && blackFriday2024PassFreeConfig,
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
