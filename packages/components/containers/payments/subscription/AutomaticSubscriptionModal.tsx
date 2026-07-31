import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import useAppLink from '@proton/components/components/link/useAppLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoad from '@proton/components/hooks/useLoad';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { ADDON_PREFIXES, CURRENCIES, DEFAULT_CYCLE, type PLANS } from '@proton/payments/core/constants';
import { fixPlanName } from '@proton/payments/core/helpers';
import type { Currency, FreeSubscription, PaymentStatus } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import { getPlanName, getValidCycle } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { Eligibility, PlanCombination } from './subscriptionEligbility';
import { getEligibility } from './subscriptionEligbility';

export const getGenericNameFromPrefix = (addonPrefix: ADDON_PREFIXES) =>
    addonPrefix.charAt(1).toUpperCase() + addonPrefix.slice(2);

const getTotalParams = (
    params: URLSearchParams
): {
    [key in ADDON_PREFIXES]?: number;
} =>
    Object.values(ADDON_PREFIXES).reduce((result, addonPrefix) => {
        // we skip the 1, capitalize the first letter after
        const addonName = getGenericNameFromPrefix(addonPrefix);

        const total = Math.floor(Number(params.get(`total${addonName}`)));

        return total > 0 ? { ...result, [addonPrefix]: total } : result;
    }, {});

export const getParameters = (
    search: string,
    plans: Plan[],
    subscription: Subscription | FreeSubscription,
    user: UserModel,
    getPreferredCurrency: ReturnType<typeof useCurrencies>['getPreferredCurrency'],
    paymentStatus: PaymentStatus
) => {
    const params = new URLSearchParams(search);

    const planName = fixPlanName(params.get('plan'), 'AutomaticSubscriptionModal') || '';
    const coupon = params.get('coupon') || undefined;
    const cycleParam = parseInt(params.get('cycle') as any, 10);
    const minimumCycleParam = parseInt(params.get('minimumCycle') as any, 10);
    const maximumCycleParam = parseInt(params.get('maximumCycle') as any, 10);
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
    const parsedMinimumCycle = getValidCycle(minimumCycleParam);
    const parsedMaximumCycle = getValidCycle(maximumCycleParam);

    const parsedCurrency =
        currencyParam && CURRENCIES.includes(currencyParam as any) ? (currencyParam as Currency) : undefined;

    const preferredCurrency = getPreferredCurrency({
        paramCurrency: parsedCurrency,
        user,
        subscription,
        plans,
        paymentStatus,
    });

    const plansMap = getPlansMap(plans, preferredCurrency, true);

    let plan = plansMap?.[planName as PLANS];
    const totals = plan ? getTotalParams(params) : {};

    if (!plan && addon === 'lumo') {
        plan = plansMap?.[getPlanName(subscription) as PLANS];
    } else if (!plan && addon === 'meet') {
        plan = plansMap?.[getPlanName(subscription) as PLANS];
    }

    const cycle = (() => {
        if (parsedCycle) {
            return parsedCycle;
        }

        if (subscription?.Cycle) {
            return Math.min(subscription.Cycle, DEFAULT_CYCLE);
        }

        return DEFAULT_CYCLE;
    })();

    return {
        plan,
        coupon,
        cycle,
        minimumCycle: parsedMinimumCycle,
        maximumCycle: parsedMaximumCycle,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: type === 'offer' || edit === 'disable' || addon === 'lumo' || addon === 'meet',
        disableCycleSelector:
            edit === 'enable' ? false : type === 'offer' || addon === 'lumo' || addon === 'meet' || Boolean(offer),
        plansMap,
        addon,
        preferredCurrency,
        totals,
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
            {getBoldFormattedText(c('Payments').t`Sorry, this offer is not available with your current plan.`)}
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
    // const protonConfig = useConfig();

    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscription, loadingSubscription] = useSubscription();

    const [user] = useUser();
    const tmpProps = useRef<{ props: OpenCallbackProps; eligibility: Eligibility } | undefined>(undefined);
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const [unavailableModalProps, setUnavailableModal, renderUnavailableModal] = useModalState();
    const [promotionAppliedProps, setPromotionAppliedModal, renderPromotionAppliedModal] = useModalState();
    const { getPreferredCurrency } = useCurrencies();
    const [paymentStatus, loadingPaymentStatus] = usePaymentStatus();

    const goToApp = useAppLink();

    useLoad();

    useEffect(() => {
        if (
            !plans ||
            !subscription ||
            loadingPlans ||
            loadingSubscription ||
            loadingSubscriptionModal ||
            loadingPaymentStatus ||
            !paymentStatus
        ) {
            return;
        }

        const {
            plan,
            cycle,
            minimumCycle,
            maximumCycle,
            coupon,
            step,
            disablePlanSelection,
            disableCycleSelector,
            plansMap,
            addon,
            totals,
            preferredCurrency,
        } = getParameters(location.search, plans, subscription, user, getPreferredCurrency, paymentStatus);

        if (!plan) {
            return;
        }

        // When you clean up this section after BF2026, please just empty the array without removing .map below. It can
        // help us in the next BF.
        const eligibleBlackFridayConfigs = [].filter(isTruthy);
        /* const eligibleBlackFridayConfigs = [
            // example:
            // {
            //     // a function that returns true if the offer is eligible
            //     eligibility: blackFriday2026InboxFreeYearlyConfigEligibility,
            //     // the offer config
            //     config: blackFriday2026InboxFreeYearlyConfig,
            // }
        ]
            .map(({ eligibility, config }) => {
                const options = {
                    subscription,
                    protonConfig,
                    user,
                    lastSubscriptionEnd: previousSubscription?.cancelTime,
                    preferredCurrency,
                    offerConfig: config,
                };

                return eligibility(options) && config;
            })
            .filter(isTruthy);*/

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
            currency: preferredCurrency,
            cycle,
            minimumCycle,
            maximumCycle,
            coupon,
            step,
            disablePlanSelection,
            disableCycleSelector,
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
            // Support for totalX params
            const hasTotalParams = Object.keys(totals).length > 0;

            if (hasTotalParams) {
                let selectedPlan = SelectedPlan.createNormalized(
                    openProps.planIDs ?? {
                        [plan.Name]: 1,
                    },
                    plansMap,
                    cycle,
                    preferredCurrency
                );

                for (const addon of Object.values(ADDON_PREFIXES)) {
                    const totalFromParams = totals[addon];

                    if (!totalFromParams) {
                        continue;
                    }

                    selectedPlan = selectedPlan.setAddonCount(
                        addon,
                        totalFromParams,
                        [ADDON_PREFIXES.LUMO, ADDON_PREFIXES.SCRIBE].includes(addon)
                    );
                }

                openProps.planIDs = {
                    ...openProps.planIDs,
                    ...selectedPlan.planIDs,
                };
                openProps.plan = undefined;

                void openSubscriptionModal(openProps);
            } else {
                if (addon === 'lumo') {
                    const selectedPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

                    // Default number of lumo addons to the total number of members
                    openProps.planIDs = selectedPlan.setLumoCount(selectedPlan.getTotalUsers()).planIDs;

                    openProps.plan = undefined; // We need to use maybePlanIDs when calculating planIDs in SubscriptionContainer
                    openProps.onSubscribed = () => {
                        goToApp('/', APPS.PROTONLUMO, false);
                    };
                } else if (addon === 'meet') {
                    const selectedPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

                    // Default number of meet addons to the total number of members
                    openProps.planIDs = selectedPlan.setMeetCount(selectedPlan.getTotalUsers()).planIDs;

                    openProps.plan = undefined; // We need to use maybePlanIDs when calculating planIDs in SubscriptionContainer
                    openProps.onSubscribed = () => {
                        goToApp('/', APPS.PROTONMEET, false);
                    };
                }

                void openSubscriptionModal(openProps);
            }
        }
    }, [loadingPlans, loadingSubscription, loadingPaymentStatus, paymentStatus, subscription, user, location.search]);

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
                            void openSubscriptionModal(tmp.props);
                        }
                    }}
                />
            )}
        </>
    );
};

export default AutomaticSubscriptionModal;
