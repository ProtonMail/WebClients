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
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/subscriptionModalTypes';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoad from '@proton/components/hooks/useLoad';
import { ADDON_GENERIC_NAMES, ADDON_PREFIXES, DEFAULT_CYCLE, type PLANS } from '@proton/payments/core/constants';
import type { FreeSubscription, PaymentStatus } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { extractSubscriptionSearchParams } from '@proton/payments/core/subscription/search-params';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import isTruthy from '@proton/utils/isTruthy';

import { useCurrencies } from '../hooks/useCurrencies';
import { SUBSCRIPTION_STEPS } from './constants';
import { type Eligibility, type PlanCombination, getEligibility } from './eligibility';

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

export const getParameters = (
    search: string,
    plans: Plan[],
    subscription: Subscription | FreeSubscription,
    user: UserModel,
    getPreferredCurrency: ReturnType<typeof useCurrencies>['getPreferredCurrency'],
    paymentStatus: PaymentStatus
) => {
    const {
        coupon,
        plan: planParam,
        cycle: parsedCycle,
        minimumCycle: parsedMinimumCycle,
        maximumCycle: parsedMaximumCycle,
        currency: parsedCurrency,
        target,
        fixedPlan,
        fixedCycle,
        upsellRef,
        ...totals
    } = extractSubscriptionSearchParams(search);

    const parsedTarget = (() => {
        if (target === 'compare') {
            return SUBSCRIPTION_STEPS.PLAN_SELECTION;
        }
        if (target === 'checkout') {
            return SUBSCRIPTION_STEPS.CHECKOUT;
        }
    })();

    const preferredCurrency = getPreferredCurrency({
        paramCurrency: parsedCurrency,
        user,
        subscription,
        plans,
        paymentStatus,
    });

    const plansMap = getPlansMap(plans, preferredCurrency, true);

    let plan = plansMap?.[planParam as PLANS];
    const expandsSubscription = !plan && (!!totals.totalLumo || !!totals.totalMeet);

    if (!plan && expandsSubscription) {
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
        planParam,
        coupon,
        cycle,
        minimumCycle: parsedMinimumCycle,
        maximumCycle: parsedMaximumCycle,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: !!fixedPlan || expandsSubscription,
        disableCycleSelector: !!fixedCycle || expandsSubscription,
        plansMap,
        preferredCurrency,
        totals,
        upsellRef,
    };
};

export const AutomaticSubscriptionModal = () => {
    const history = useHistory();
    const { search } = useLocation();

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
            planParam,
            cycle,
            minimumCycle,
            maximumCycle,
            coupon,
            step,
            disablePlanSelection,
            disableCycleSelector,
            plansMap,
            totals,
            preferredCurrency,
            upsellRef,
        } = getParameters(search ?? '', plans, subscription, user, getPreferredCurrency, paymentStatus);

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

        history.replace({ search: '' });

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
            upsellRef,
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
            if (!planParam && totals.totalLumo) {
                const selectedPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

                openProps.planIDs = selectedPlan.setLumoCount(selectedPlan.getTotalUsers()).planIDs;
                openProps.plan = undefined;
                openProps.onSubscribed = () => {
                    goToApp('/', APPS.PROTONLUMO, false);
                };

                void openSubscriptionModal(openProps);
            } else if (!planParam && totals.totalMeet) {
                const selectedPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

                openProps.planIDs = selectedPlan.setMeetCount(selectedPlan.getTotalUsers()).planIDs;
                openProps.plan = undefined;
                openProps.onSubscribed = () => {
                    goToApp('/', APPS.PROTONMEET, false);
                };

                void openSubscriptionModal(openProps);
            } else {
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
                        const totalFromParams = totals[`total${ADDON_GENERIC_NAMES[addon]}`];

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
                    void openSubscriptionModal(openProps);
                }
            }
        }
    }, [loadingPlans, loadingSubscription, loadingPaymentStatus, paymentStatus, subscription, user, search]);

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
