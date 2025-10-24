import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
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
import useConfig from '@proton/components/hooks/useConfig';
import useLoad from '@proton/components/hooks/useLoad';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import type { PLANS } from '@proton/payments';
import {
    CURRENCIES,
    type Currency,
    DEFAULT_CYCLE,
    type PaymentStatus,
    type Plan,
    SelectedPlan,
    type Subscription,
    fixPlanName,
    getPlanName,
    getPlansMap,
    getValidCycle,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { blackFriday2025DriveFreeMonthlyConfig } from '../../offers/operations/blackFriday2025DriveFreeMonthly/configuration';
import blackFriday2025DriveFreeMonthlyConfigEligibility from '../../offers/operations/blackFriday2025DriveFreeMonthly/eligibility';
import { blackFriday2025DriveFreeYearlyConfig } from '../../offers/operations/blackFriday2025DriveFreeYearly/configuration';
import blackFriday2025DriveFreeYearlyConfigEligibility from '../../offers/operations/blackFriday2025DriveFreeYearly/eligibility';
import { blackFriday2025DrivePlusMonthly2Config } from '../../offers/operations/blackFriday2025DrivePlusMonthly2/configuration';
import blackFriday2025DrivePlusMonthly2ConfigEligibility from '../../offers/operations/blackFriday2025DrivePlusMonthly2/eligibility';
import { blackFriday2025DrivePlusMonthlyConfig } from '../../offers/operations/blackFriday2025DrivePlusMonthly/configuration';
import blackFriday2025DrivePlusMonthlyConfigEligibility from '../../offers/operations/blackFriday2025DrivePlusMonthly/eligibility';
import { blackFriday2025DrivePlusYearlyConfig } from '../../offers/operations/blackFriday2025DrivePlusYearly/configuration';
import blackFriday2025DrivePlusYearlyConfigEligibility from '../../offers/operations/blackFriday2025DrivePlusYearly/eligibility';
import { blackFriday2025DuoConfig } from '../../offers/operations/blackFriday2025Duo/configuration';
import blackFriday2025DuoConfigEligibility from '../../offers/operations/blackFriday2025Duo/eligibility';
import { blackFriday2025FamilyMonthlyConfig } from '../../offers/operations/blackFriday2025FamilyMonthly/configuration';
import blackFriday2025FamilyMonthlyConfigEligibility from '../../offers/operations/blackFriday2025FamilyMonthly/eligibility';
import { blackFriday2025InboxFreeMonthlyConfig } from '../../offers/operations/blackFriday2025InboxFreeMonthly/configuration';
import blackFriday2025InboxFreeMonthlyConfigEligibility from '../../offers/operations/blackFriday2025InboxFreeMonthly/eligibility';
import { blackFriday2025InboxFreeYearlyConfig } from '../../offers/operations/blackFriday2025InboxFreeYearly/configuration';
import blackFriday2025InboxFreeYearlyConfigEligibility from '../../offers/operations/blackFriday2025InboxFreeYearly/eligibility';
import { blackFriday2025InboxPlusMonthly2Config } from '../../offers/operations/blackFriday2025InboxPlusMonthly2/configuration';
import blackFriday2025InboxPlusMonthly2ConfigEligibility from '../../offers/operations/blackFriday2025InboxPlusMonthly2/eligibility';
import { blackFriday2025InboxPlusMonthlyConfig } from '../../offers/operations/blackFriday2025InboxPlusMonthly/configuration';
import blackFriday2025InboxPlusMonthlyConfigEligibility from '../../offers/operations/blackFriday2025InboxPlusMonthly/eligibility';
import { blackFriday2025InboxPlusYearly2Config } from '../../offers/operations/blackFriday2025InboxPlusYearly2/configuration';
import blackFriday2025InboxPlusYearly2ConfigEligibility from '../../offers/operations/blackFriday2025InboxPlusYearly2/eligibility';
import { blackFriday2025InboxPlusYearlyConfig } from '../../offers/operations/blackFriday2025InboxPlusYearly/configuration';
import blackFriday2025InboxPlusYearlyConfigEligibility from '../../offers/operations/blackFriday2025InboxPlusYearly/eligibility';
import { blackFriday2025LumoFreeYearlyConfig } from '../../offers/operations/blackFriday2025LumoFreeYearly/configuration';
import blackFriday2025LumoFreeYearlyConfigEligibility from '../../offers/operations/blackFriday2025LumoFreeYearly/eligibility';
import { blackFriday2025LumoPlusMonthlyConfig } from '../../offers/operations/blackFriday2025LumoPlusMonthly/configuration';
import blackFriday2025LumoPlusMonthlyConfigEligibility from '../../offers/operations/blackFriday2025LumoPlusMonthly/eligibility';
import { blackFriday2025PassFreeMonthlyConfig } from '../../offers/operations/blackFriday2025PassFreeMonthly/configuration';
import blackFriday2025PassFreeMonthlyConfigEligibility from '../../offers/operations/blackFriday2025PassFreeMonthly/eligibility';
import { blackFriday2025PassFreeYearlyConfig } from '../../offers/operations/blackFriday2025PassFreeYearly/configuration';
import blackFriday2025PassFreeYearlyConfigEligibility from '../../offers/operations/blackFriday2025PassFreeYearly/eligibility';
import { blackFriday2025PassPlusMonthly2Config } from '../../offers/operations/blackFriday2025PassPlusMonthly2/configuration';
import blackFriday2025PassPlusMonthly2ConfigEligibility from '../../offers/operations/blackFriday2025PassPlusMonthly2/eligibility';
import { blackFriday2025PassPlusMonthlyConfig } from '../../offers/operations/blackFriday2025PassPlusMonthly/configuration';
import blackFriday2025PassPlusMonthlyConfigEligibility from '../../offers/operations/blackFriday2025PassPlusMonthly/eligibility';
import { blackFriday2025PassPlusYearlyConfig } from '../../offers/operations/blackFriday2025PassPlusYearly/configuration';
import blackFriday2025PassPlusYearlyConfigEligibility from '../../offers/operations/blackFriday2025PassPlusYearly/eligibility';
import { blackFriday2025UnlimitedConfig } from '../../offers/operations/blackFriday2025Unlimited/configuration';
import blackFriday2025UnlimitedConfigEligibility from '../../offers/operations/blackFriday2025Unlimited/eligibility';
import { blackFriday2025VPNFreeMonthlyConfig } from '../../offers/operations/blackFriday2025VPNFreeMonthly/configuration';
import blackFriday2025VPNFreeMonthlyConfigEligibility from '../../offers/operations/blackFriday2025VPNFreeMonthly/eligibility';
import { blackFriday2025VPNFreeYearlyConfig } from '../../offers/operations/blackFriday2025VPNFreeYearly/configuration';
import blackFriday2025VPNFreeYearlyConfigEligibility from '../../offers/operations/blackFriday2025VPNFreeYearly/eligibility';
import { blackFriday2025VPNPlusMonthly2Config } from '../../offers/operations/blackFriday2025VPNPlusMonthly2/configuration';
import blackFriday2025VPNPlusMonthly2ConfigEligibility from '../../offers/operations/blackFriday2025VPNPlusMonthly2/eligibility';
import { blackFriday2025VPNPlusMonthlyConfig } from '../../offers/operations/blackFriday2025VPNPlusMonthly/configuration';
import blackFriday2025VPNPlusMonthlyConfigEligibility from '../../offers/operations/blackFriday2025VPNPlusMonthly/eligibility';
import { blackFriday2025VPNPlusTwoYearConfig } from '../../offers/operations/blackFriday2025VPNPlusTwoYear/configuration';
import blackFriday2025VPNPlusTwoYearConfigEligibility from '../../offers/operations/blackFriday2025VPNPlusTwoYear/eligibility';
import { blackFriday2025VPNPlusYearly2Config } from '../../offers/operations/blackFriday2025VPNPlusYearly2/configuration';
import blackFriday2025VPNPlusYearly2ConfigEligibility from '../../offers/operations/blackFriday2025VPNPlusYearly2/eligibility';
import { blackFriday2025VPNPlusYearlyConfig } from '../../offers/operations/blackFriday2025VPNPlusYearly/configuration';
import blackFriday2025VPNPlusYearlyConfigEligibility from '../../offers/operations/blackFriday2025VPNPlusYearly/eligibility';
import type { Eligibility, PlanCombination } from './subscriptionEligbility';
import { getEligibility } from './subscriptionEligbility';

const getParameters = (
    search: string,
    plans: Plan[],
    subscription: Subscription,
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

    if (!plan && addon === 'lumo') {
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
        currency: parsedCurrency,
        step: parsedTarget || SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: type === 'offer' || edit === 'disable' || addon === 'lumo',
        disableCycleSelector: edit === 'enable' ? false : type === 'offer' || addon === 'lumo' || Boolean(offer),
        plansMap,
        addon,
        preferredCurrency,
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
    const protonConfig = useConfig();

    const [openSubscriptionModal, loadingModal] = useSubscriptionModal();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscription, loadingSubscription] = useSubscription();
    const [previousSubscription, loadingPreviousSubscription] = usePreviousSubscription();

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
            loadingModal ||
            loadingPreviousSubscription ||
            loadingPaymentStatus ||
            !paymentStatus
        ) {
            return;
        }

        const {
            plan,
            currency,
            cycle,
            minimumCycle,
            maximumCycle,
            coupon,
            step,
            disablePlanSelection,
            disableCycleSelector,
            plansMap,
            addon,
            preferredCurrency,
        } = getParameters(location.search, plans, subscription, user, getPreferredCurrency, paymentStatus);

        if (!plan) {
            return;
        }

        const eligibleBlackFridayConfigs = [
            {
                eligibility: blackFriday2025InboxFreeYearlyConfigEligibility,
                config: blackFriday2025InboxFreeYearlyConfig,
            },
            {
                eligibility: blackFriday2025InboxFreeMonthlyConfigEligibility,
                config: blackFriday2025InboxFreeMonthlyConfig,
            },
            {
                eligibility: blackFriday2025InboxPlusMonthlyConfigEligibility,
                config: blackFriday2025InboxPlusMonthlyConfig,
            },
            {
                eligibility: blackFriday2025InboxPlusMonthly2ConfigEligibility,
                config: blackFriday2025InboxPlusMonthly2Config,
            },
            {
                eligibility: blackFriday2025InboxPlusYearlyConfigEligibility,
                config: blackFriday2025InboxPlusYearlyConfig,
            },
            {
                eligibility: blackFriday2025InboxPlusYearly2ConfigEligibility,
                config: blackFriday2025InboxPlusYearly2Config,
            },
            {
                eligibility: blackFriday2025UnlimitedConfigEligibility,
                config: blackFriday2025UnlimitedConfig,
            },
            {
                eligibility: blackFriday2025DuoConfigEligibility,
                config: blackFriday2025DuoConfig,
            },
            {
                eligibility: blackFriday2025FamilyMonthlyConfigEligibility,
                config: blackFriday2025FamilyMonthlyConfig,
            },
            {
                eligibility: blackFriday2025VPNFreeYearlyConfigEligibility,
                config: blackFriday2025VPNFreeYearlyConfig,
            },
            {
                eligibility: blackFriday2025VPNFreeMonthlyConfigEligibility,
                config: blackFriday2025VPNFreeMonthlyConfig,
            },
            {
                eligibility: blackFriday2025VPNPlusMonthlyConfigEligibility,
                config: blackFriday2025VPNPlusMonthlyConfig,
            },
            {
                eligibility: blackFriday2025VPNPlusMonthly2ConfigEligibility,
                config: blackFriday2025VPNPlusMonthly2Config,
            },
            {
                eligibility: blackFriday2025VPNPlusYearlyConfigEligibility,
                config: blackFriday2025VPNPlusYearlyConfig,
            },
            {
                eligibility: blackFriday2025VPNPlusYearly2ConfigEligibility,
                config: blackFriday2025VPNPlusYearly2Config,
            },
            {
                eligibility: blackFriday2025VPNPlusTwoYearConfigEligibility,
                config: blackFriday2025VPNPlusTwoYearConfig,
            },
            {
                eligibility: blackFriday2025DriveFreeYearlyConfigEligibility,
                config: blackFriday2025DriveFreeYearlyConfig,
            },
            {
                eligibility: blackFriday2025DriveFreeMonthlyConfigEligibility,
                config: blackFriday2025DriveFreeMonthlyConfig,
            },
            {
                eligibility: blackFriday2025DrivePlusMonthlyConfigEligibility,
                config: blackFriday2025DrivePlusMonthlyConfig,
            },
            {
                eligibility: blackFriday2025DrivePlusMonthly2ConfigEligibility,
                config: blackFriday2025DrivePlusMonthly2Config,
            },
            {
                eligibility: blackFriday2025DrivePlusYearlyConfigEligibility,
                config: blackFriday2025DrivePlusYearlyConfig,
            },
            {
                eligibility: blackFriday2025PassFreeYearlyConfigEligibility,
                config: blackFriday2025PassFreeYearlyConfig,
            },
            {
                eligibility: blackFriday2025PassFreeMonthlyConfigEligibility,
                config: blackFriday2025PassFreeMonthlyConfig,
            },
            {
                eligibility: blackFriday2025PassPlusMonthlyConfigEligibility,
                config: blackFriday2025PassPlusMonthlyConfig,
            },
            {
                eligibility: blackFriday2025PassPlusMonthly2ConfigEligibility,
                config: blackFriday2025PassPlusMonthly2Config,
            },
            {
                eligibility: blackFriday2025PassPlusYearlyConfigEligibility,
                config: blackFriday2025PassPlusYearlyConfig,
            },
            {
                eligibility: blackFriday2025LumoFreeYearlyConfigEligibility,
                config: blackFriday2025LumoFreeYearlyConfig,
            },
            {
                eligibility: blackFriday2025LumoPlusMonthlyConfigEligibility,
                config: blackFriday2025LumoPlusMonthlyConfig,
            },
        ]
            .map(({ eligibility, config }) => {
                const options = {
                    subscription,
                    protonConfig,
                    user,
                    lastSubscriptionEnd: previousSubscription?.previousSubscriptionEndTime,
                    preferredCurrency,
                    offerConfig: config,
                };

                return eligibility(options) && config;
            })
            .filter(isTruthy);

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
            minimumCycle,
            maximumCycle,
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
    }, [loadingPlans, loadingSubscription, loadingModal, loadingPreviousSubscription, location.search]);

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
