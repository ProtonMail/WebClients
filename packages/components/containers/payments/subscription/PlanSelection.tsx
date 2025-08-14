import { type ReactElement, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import WalletLogo from '@proton/components/components/logo/WalletLogo';
import Option from '@proton/components/components/option/Option';
import Price from '@proton/components/components/price/Price';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Tabs from '@proton/components/components/tabs/Tabs';
import useCancellationFlow from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationFlow';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import {
    CYCLE,
    type Currency,
    type Cycle,
    FREE_PLAN,
    type FreePlanDefault,
    type FreeSubscription,
    PLANS,
    type PaymentStatus,
    type PaymentsApi,
    type Plan,
    type PlanIDs,
    type PlansMap,
    Renew,
    type Subscription,
    type SubscriptionPlan,
    getCanAccessFamilyPlans,
    getCanSubscriptionAccessDuoPlan,
    getIpPricePerMonth,
    getIsB2BAudienceFromPlan,
    isFreeSubscription as getIsFreeSubscription,
    getMaximumCycleForApp,
    getPlan,
    getPlansMap,
    hasLumoAddon,
    hasMaximumCycle,
    hasPass,
    hasPassFamily,
    hasSomeAddonOrPlan,
    hasVisionary,
    isAnyManagedExternally,
    isCheckForbidden,
    isFreeSubscription,
    isRegionalCurrency,
    mainCurrencies,
    switchPlan,
} from '@proton/payments';
import { OfferPrice } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { selectPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import { Audience, type Organization, type UserModel, type VPNServersCountData } from '@proton/shared/lib/interfaces';
import { isFree } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import CurrencySelector from '../CurrencySelector';
import CycleSelector, { getRestrictedCycle } from '../CycleSelector';
import { getAllFeatures } from '../features';
import type { ShortPlanLike } from '../features/interface';
import { isShortPlanLike } from '../features/interface';
import { getShortPlan, getVPNEnterprisePlan } from '../features/plan';
import PlanCard, { type HocPrice } from './PlanCard';
import PlanCardFeatures, { PlanCardFeatureList, PlanCardFeaturesShort } from './PlanCardFeatures';
import useCancellationTelemetry from './cancellationFlow/useCancellationTelemetry';
import { getAllowedCycles } from './helpers';
import VpnEnterpriseAction from './helpers/VpnEnterpriseAction';
import { getAutoCoupon, getBundleProPlanToUse, notHigherThanAvailableOnBackend } from './helpers/payment';

import './PlanSelection.scss';

export interface SelectedProductPlans {
    [Audience.B2C]: PLANS;
    [Audience.B2B]: PLANS;
    [Audience.FAMILY]: PLANS;
}

interface Tab {
    title: string;
    content: ReactElement;
    audience: Audience;
}

interface Props {
    app: ProductParam;
    planIDs: PlanIDs;
    currency: Currency;
    hasPlanSelectionComparison?: boolean;
    hasFreePlan?: boolean;
    cycle: Cycle;
    minimumCycle?: Cycle;
    maximumCycle?: Cycle;
    plans: Plan[];
    freePlan: FreePlanDefault;
    vpnServers: VPNServersCountData;
    loading?: boolean;
    mode: 'signup' | 'settings' | 'modal' | 'upsell-modal';
    onChangePlanIDs: (newPlanIDs: PlanIDs, cycle: Cycle, currency: Currency) => void;
    onChangeCurrency: (newCurrency: Currency) => void;
    onChangeCycle: (newCyle: Cycle) => void;
    audience: Audience;
    onChangeAudience: (newAudience: Audience) => void;
    selectedProductPlans: SelectedProductPlans;
    onChangeSelectedProductPlans: (newPlans: SelectedProductPlans) => void;
    subscription?: Subscription | FreeSubscription;
    organization?: Organization;
    filter?: Audience[];
    paymentStatus: PaymentStatus;
    paymentsApi: PaymentsApi;
    coupon?: string;
}

const getCycleSelectorOptions = () => {
    const oneMonth = { text: c('Billing cycle option').t`1 month`, value: CYCLE.MONTHLY };
    const oneYear = { text: c('Billing cycle option').t`12 months`, value: CYCLE.YEARLY };

    return [oneMonth, oneYear];
};

const ActionLabel = ({ plan, currency, cycle }: { plan: Plan; currency: Currency; cycle: Cycle }) => {
    const serverPrice = <Price currency={currency}>{getIpPricePerMonth(cycle)}</Price>;
    // translator: example of full sentence: "VPN Business requires at least 1 dedicated server (CHF 39.99 /month)"
    const serverPriceStr = c('Info').jt`(${serverPrice}/month)`;
    const serverPricePerMonth = <span className="text-nowrap">{serverPriceStr}</span>;

    return (
        <div className="mt-6 flex flex-nowrap color-weak">
            <div className="shrink-0 mr-2">
                <Icon name="info-circle" />
            </div>
            <div>{c('Info').jt`${plan.Title} requires at least 1 dedicated server ${serverPricePerMonth}`}</div>
        </div>
    );
};

function excludingCurrentPlanWithMaxCycle(
    currentPlan: SubscriptionPlan | null | undefined,
    alreadyHasMaxCycle: boolean
) {
    return (plan: Plan | ShortPlanLike): boolean => {
        if (isShortPlanLike(plan)) {
            return true;
        }

        const isCurrentPlan = currentPlan?.ID === plan.ID;
        const shouldNotRenderCurrentPlan = isCurrentPlan && alreadyHasMaxCycle;
        return !shouldNotRenderCurrentPlan;
    };
}

function excludingTheOnlyFreePlan(plan: Plan | ShortPlanLike, _: number, allPlans: (Plan | ShortPlanLike)[]): boolean {
    return !(plan === FREE_PLAN && allPlans.length === 1);
}

/**
 * There might be cases when all the possible cycles are forbidden for a plan.
 * This can happen if there is a subscription with a selected plan managed externally, by Google or Apple.
 * In this case we don't want to display this plan to the user - they can't change anything anyways.
 */
function excludingPlansWithAllChecksFordidden(
    subscription: Subscription | FreeSubscription | null | undefined,
    plansMap: PlansMap
) {
    return (plan: Plan | ShortPlanLike | PLANS) => {
        if (isShortPlanLike(plan) || !subscription || isFreeSubscription(subscription)) {
            return true;
        }

        const planName = typeof plan === 'string' ? plan : plan.Name;

        const planIDs = { [planName]: 1 };
        const allowedCycles = getAllowedCycles({ subscription, planIDs, currency: subscription.Currency, plansMap });

        const allChecksForbidden = allowedCycles.every((cycle) => isCheckForbidden(subscription, planIDs, cycle));
        return !allChecksForbidden;
    };
}

export type AccessiblePlansHookProps = {
    user: UserModel;
} & Pick<
    Props,
    | 'app'
    | 'vpnServers'
    | 'selectedProductPlans'
    | 'subscription'
    | 'planIDs'
    | 'hasFreePlan'
    | 'paymentStatus'
    | 'plans'
    | 'currency'
    | 'audience'
>;

export function useAccessiblePlans({
    hasFreePlan,
    selectedProductPlans,
    subscription,
    planIDs,
    app,
    vpnServers,
    paymentStatus,
    user,
    plans,
    currency,
    audience,
}: AccessiblePlansHookProps) {
    const isVpnSettingsApp = app === APPS.PROTONVPN_SETTINGS;
    const isPassSettingsApp = app === APPS.PROTONPASS;
    const isDriveSettingsApp = app === APPS.PROTONDRIVE || app === APPS.PROTONDOCS;
    const isWalletSettingsApp = app === APPS.PROTONWALLET;

    const plansMap = getPlansMap(plans, currency, false);

    const canAccessDuoPlan = getCanSubscriptionAccessDuoPlan(subscription);
    const { getAvailableCurrencies } = useCurrencies();

    const enabledProductB2CPlanNames = [
        PLANS.MAIL,
        PLANS.VPN2024,
        PLANS.DRIVE,
        !user.hasPassLifetime && PLANS.PASS,
        PLANS.LUMO,
    ]
        .filter(isTruthy)
        .filter(excludingPlansWithAllChecksFordidden(subscription, plansMap));

    const enabledProductB2CPlans = enabledProductB2CPlanNames.map((planName) => plansMap[planName]).filter(isTruthy);

    const alreadyHasMaxCycle = hasMaximumCycle(subscription);

    const currentPlan = getPlan(subscription);

    function filterPlans(plans: (Plan | null | undefined)[]): Plan[];
    function filterPlans(plans: (Plan | ShortPlanLike | null | undefined)[]): (Plan | ShortPlanLike)[];
    function filterPlans(plans: (Plan | ShortPlanLike | null | undefined)[]): (Plan | ShortPlanLike)[] {
        return plans
            .filter(isTruthy)
            .filter(excludingCurrentPlanWithMaxCycle(currentPlan, alreadyHasMaxCycle))
            .filter(excludingTheOnlyFreePlan)
            .filter(excludingPlansWithAllChecksFordidden(subscription, plansMap));
    }

    let IndividualPlans: (Plan | ShortPlanLike)[] = [];

    const driveIndividualPlans = filterPlans([
        hasFreePlan ? FREE_PLAN : null,
        plansMap[PLANS.DRIVE],
        plansMap[PLANS.BUNDLE],
        plansMap[PLANS.DUO],
    ]);

    const walletIndividualPlans = filterPlans([hasFreePlan ? FREE_PLAN : null, plansMap[PLANS.VISIONARY]]);

    const isDriveIndividualPlans = isDriveSettingsApp && driveIndividualPlans.length !== 0;
    const isWalletIndividualPlans = isWalletSettingsApp && walletIndividualPlans.length !== 0;

    // Update IndividualPlans to use Drive-specific plans when in Drive settings app
    if (isDriveIndividualPlans) {
        IndividualPlans = driveIndividualPlans;
    } else if (isWalletIndividualPlans) {
        IndividualPlans = walletIndividualPlans;
    } else {
        const plusPlan =
            enabledProductB2CPlans.find((plan) => plan.Name === selectedProductPlans[Audience.B2C]) ??
            enabledProductB2CPlans[0] ??
            plansMap[PLANS.MAIL];

        const canChangeToLumoPlus = !hasLumoAddon(subscription) && !hasVisionary(subscription);
        const showPlusPlan = plusPlan.Name !== PLANS.LUMO || canChangeToLumoPlus;

        IndividualPlans = filterPlans([
            hasFreePlan ? FREE_PLAN : null,
            showPlusPlan ? plusPlan : null,
            plansMap[PLANS.BUNDLE],
            canAccessDuoPlan ? plansMap[PLANS.DUO] : null,
        ]);
    }

    const canAccessPassFamilyPlan =
        (isFree(user) && app === APPS.PROTONPASS) || hasPass(subscription) || hasPassFamily(subscription);

    let FamilyPlans: Plan[] = [];
    if (getCanAccessFamilyPlans(subscription)) {
        FamilyPlans = filterPlans([
            hasFreePlan ? FREE_PLAN : null,
            canAccessDuoPlan && !canAccessPassFamilyPlan ? plansMap[PLANS.DUO] : null,
            canAccessPassFamilyPlan ? plansMap[PLANS.PASS_FAMILY] : null,
            plansMap[PLANS.FAMILY],
        ]);
    }

    // some new regional currencies might support VPN enterprise too
    const hasVpnEnterprise = mainCurrencies.includes(currency);

    const vpnB2BPlans = filterPlans([
        plansMap[PLANS.VPN_PRO],
        plansMap[PLANS.VPN_BUSINESS],
        hasVpnEnterprise ? getVPNEnterprisePlan(vpnServers) : null,
    ]);

    const bundleProPlan = getBundleProPlanToUse({ plansMap, planIDs });
    const passB2BPlans = filterPlans([
        plansMap[PLANS.PASS_PRO],
        plansMap[PLANS.PASS_BUSINESS],
        plansMap[bundleProPlan],
    ]);

    const driveB2BPlans = filterPlans([plansMap[PLANS.DRIVE_BUSINESS], plansMap[bundleProPlan]]);

    const walletB2BPlans = filterPlans([plansMap[bundleProPlan]]);

    /**
     * The VPN B2B plans should be displayed only in the ProtonVPN Settings app (protonvpn.com).
     *
     * The check for length of plans is needed for the case if the VPN B2B plans are not available.
     * Then we should fallback to the usual set of plans. It can happen if backend doesn't return the VPN B2B plans.
     */
    const isVpnB2bPlans = isVpnSettingsApp && vpnB2BPlans.length !== 0;
    const isPassB2bPlans = isPassSettingsApp && passB2BPlans.length !== 0;
    const isDriveB2bPlans = isDriveSettingsApp && driveB2BPlans.length !== 0;
    const isWalletB2BPlans = isWalletSettingsApp && walletB2BPlans.length !== 0;

    const B2BPlans: (Plan | ShortPlanLike)[] = (() => {
        // In the realm of multi-subs, if user has any subscription managed exteranlly, we don't display the B2B plans
        // It can cause any sort of problems at the moment: with addons transfering, with subscriptions,
        // with organizations.
        if (isAnyManagedExternally(subscription)) {
            return [];
        }

        if (isVpnB2bPlans) {
            return vpnB2BPlans;
        } else if (isPassB2bPlans) {
            // Lifetime users shouldn't see Pass B2B plans
            if (!user.hasPassLifetime) {
                return passB2BPlans;
            }
        } else if (isDriveB2bPlans) {
            return driveB2BPlans;
        } else if (isWalletB2BPlans) {
            return walletB2BPlans;
        } else {
            return filterPlans([plansMap[PLANS.MAIL_PRO], plansMap[PLANS.MAIL_BUSINESS], plansMap[bundleProPlan]]);
        }

        return [];
    })();

    const isPassLifetimeEligible =
        isPassSettingsApp &&
        !user.hasPassLifetime &&
        audience === Audience.B2C &&
        !!plansMap[PLANS.PASS_LIFETIME] &&
        currentPlan?.Name !== PLANS.PASS_FAMILY &&
        !getIsB2BAudienceFromPlan(currentPlan?.Name);

    const accessiblePlans = [
        ...IndividualPlans,
        ...FamilyPlans,
        ...B2BPlans,
        ...enabledProductB2CPlans,
        ...(isPassLifetimeEligible ? [plansMap[PLANS.PASS_LIFETIME]] : []),
    ]
        .filter(isTruthy)
        .filter((it): it is Plan => !isShortPlanLike(it));

    const accessiblePlansWithAllCurrencies = filterPlans(
        accessiblePlans.flatMap((renderedPlan) =>
            plans.filter((availablePlan) => availablePlan.Name === renderedPlan.Name)
        )
    );

    const availableCurrencies = getAvailableCurrencies({
        paymentStatus,
        user,
        subscription,
        plans: accessiblePlansWithAllCurrencies,
    });

    const result = {
        enabledProductB2CPlans,
        IndividualPlans,
        FamilyPlans,
        B2BPlans,
        currentPlan,
        alreadyHasMaxCycle,
        isVpnSettingsApp,
        isVpnB2bPlans,
        availableCurrencies,
        isPassLifetimeEligible,
    };

    return result;
}

export function getMaximumCycle(
    maybeMaximumCycle: CYCLE | undefined,
    audience: Audience,
    app: ProductParam,
    currency: Currency
) {
    let maximumCycle: Cycle | undefined = maybeMaximumCycle;
    if (audience === Audience.B2B) {
        maximumCycle = Math.min(maximumCycle ?? CYCLE.YEARLY, CYCLE.YEARLY);
    }

    maximumCycle = Math.min(maximumCycle ?? CYCLE.TWO_YEARS, getMaximumCycleForApp(app, currency));
    return maximumCycle;
}

const PlanSelection = (props: Props) => {
    const {
        app,
        mode,
        plans,
        freePlan,
        vpnServers,
        cycle: cycleProp,
        minimumCycle: maybeMinimumCycle,
        maximumCycle: maybeMaximumCycle,
        currency,
        loading,
        subscription,
        organization,
        onChangePlanIDs,
        onChangeCurrency,
        onChangeCycle,
        audience,
        onChangeAudience,
        selectedProductPlans,
        onChangeSelectedProductPlans,
        filter,
        coupon,
    } = props;

    // strict plans map doens't have plan fallback if currency is missing. If there is no plan for specified currency,
    // then it will be exluded from the plans map. This way we display only plans with the selected currency.
    const plansMap = getPlansMap(plans, currency, false);

    const [user] = useUser();

    const {
        IndividualPlans,
        FamilyPlans,
        B2BPlans,
        enabledProductB2CPlans,
        currentPlan,
        alreadyHasMaxCycle,
        isVpnSettingsApp,
        isVpnB2bPlans,
        availableCurrencies,
        isPassLifetimeEligible,
    } = useAccessiblePlans({
        ...props,
        user,
    });

    const isFreeSubscription = getIsFreeSubscription(subscription);
    // experimentally re-enable the cycle selector in Pass App even for paid users. Previously it was problematic due to
    // the chargebee migration and inability to do subscription/check for the same plan+cycle as user currently has.
    // After some changes the subscription/check is no longer triggered at the stage of plan selection, but I want to be
    // extra carefull and keep it limited to the pass app only for now. If that's ok then renderCycleSelector can be set
    // to always true.
    const renderCycleSelector = isFreeSubscription || props.app === APPS.PROTONPASS;

    const { b2bAccess, b2cAccess, redirectToCancellationFlow } = useCancellationFlow();
    const { sendStartCancellationPricingReport } = useCancellationTelemetry();

    const maximumCycle: Cycle | undefined = getMaximumCycle(maybeMaximumCycle, audience, app, currency);

    const cycleSelectorOptions = getCycleSelectorOptions();
    const { cycle: restrictedCycle } = getRestrictedCycle({
        cycle: cycleProp,
        minimumCycle: maybeMinimumCycle,
        maximumCycle,
        options: cycleSelectorOptions,
    });

    const [lifetimeSelected, setLifetimeSelected] = useState(false);
    useEffect(
        function unselectLifetimeTab() {
            if (audience !== Audience.B2C || user.hasPassLifetime) {
                setLifetimeSelected(false);
            }
        },
        [audience, user.hasPassLifetime]
    );

    const isSignupMode = mode === 'signup';
    const features = getAllFeatures({
        plansMap,
        serversCount: vpnServers,
        freePlan,
    });

    const b2cRecommendedPlans = [
        hasSomeAddonOrPlan(subscription, [PLANS.BUNDLE, PLANS.VISIONARY, PLANS.FAMILY]) ? undefined : PLANS.BUNDLE,
        PLANS.DUO,
        PLANS.FAMILY,
    ].filter(isTruthy);

    const familyRecommendedPlans = [
        hasSomeAddonOrPlan(subscription, [
            PLANS.FAMILY,
            PLANS.MAIL_PRO,
            PLANS.MAIL_BUSINESS,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.VISIONARY,
        ])
            ? undefined
            : PLANS.DUO,
        PLANS.PASS_FAMILY,
        PLANS.FAMILY,
    ].filter(isTruthy);

    const b2bRecommendedPlans = [PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024];
    const hasRecommended = new Set<Audience>();

    const renderPlanCard = (plan: Plan, audience: Audience, recommendedPlans: PLANS[], plansInAudience: Plan[]) => {
        const isFree = plan.ID === PLANS.FREE;
        const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
        const shouldNotRenderCurrentPlan = isCurrentPlan && alreadyHasMaxCycle;
        if (shouldNotRenderCurrentPlan) {
            return null;
        }
        const isRecommended = !hasRecommended.has(audience) && recommendedPlans.includes(plan.Name as PLANS);
        // Only find one recommended plan, in order of priority
        if (isRecommended) {
            hasRecommended.add(audience);
        }
        const shortPlan = getShortPlan(plan.Name as PLANS, plansMap, { vpnServers, freePlan });

        if (!shortPlan) {
            return null;
        }

        // This was added to display Wallet Plus 12 even if users selects 24 months. wallet2024 doesn't have 24 cycle
        // on the backend, so without this hack the frontend attempts to display wallet2024 24 months, doesn't
        // find prices for it and completely hides the card of wallet plan.
        const cycle = notHigherThanAvailableOnBackend({ [plan.Name]: 1 }, plansMap, restrictedCycle);

        const planTitle = shortPlan.title;
        const selectedPlanLabel = isFree ? c('Action').t`Current plan` : c('Action').t`Edit subscription`;
        const action = isCurrentPlan ? selectedPlanLabel : selectPlanOrAppNameText(planTitle);
        const actionLabel =
            plan.Name === PLANS.VPN_BUSINESS ? (
                <ActionLabel plan={plan} currency={plan.Currency} cycle={cycle} />
            ) : null;

        const plansList =
            audience === Audience.B2C
                ? enabledProductB2CPlans.map(({ Name, Title }) => {
                      return {
                          planName: Name,
                          label: Title,
                      };
                  })
                : [];
        // Only show the selectable plans dropdown in case the user is free
        const isSelectable =
            plansList.some(({ planName: otherPlanName }) => otherPlanName === plan.Name) && user.isFree;
        const selectedPlan = plansList.some(
            ({ planName: otherPlanName }) => otherPlanName === selectedProductPlans[audience]
        )
            ? selectedProductPlans[audience]
            : plansList[0]?.planName;

        const hasPlanWithCoupon = plansInAudience.some(
            (plan) => !!getAutoCoupon({ planIDs: { [plan.Name]: 1 }, cycle, coupon })
        );
        const groupId = hasPlanWithCoupon ? `plan-selection-audience-${audience}` : undefined;

        const priceElement: HocPrice = (props) => (
            <OfferPrice
                key={`${plan.Name}-${plan.Currency}-${cycle}-${plan.ID}-${audience}`}
                planToCheck={{
                    planIDs: {
                        [plan.Name]: 1,
                    },
                    cycle,
                    currency: plan.Currency,
                    coupon,
                    groupId,
                }}
                {...props}
            />
        );

        const featuresElement =
            mode === 'settings' || mode === 'upsell-modal' || (audience === Audience.B2B && isVpnSettingsApp) ? (
                <PlanCardFeaturesShort plan={shortPlan} icon />
            ) : (
                <PlanCardFeatures audience={audience} features={features} planName={shortPlan.plan} app={app} />
            );

        return (
            <PlanCard
                isCurrentPlan={!isSignupMode && isCurrentPlan}
                action={action}
                actionLabel={actionLabel}
                enableActionLabelSpacing={isVpnB2bPlans && audience === Audience.B2B}
                info={shortPlan.description}
                planName={plan.Name as PLANS}
                planTitle={
                    plansList && isSelectable ? (
                        <SelectTwo
                            value={selectedPlan}
                            onChange={({ value: newPlanName }) => {
                                onChangeSelectedProductPlans({ ...selectedProductPlans, [audience]: newPlanName });
                            }}
                        >
                            {plansList.map(({ planName, label }) => (
                                <Option key={label} value={planName} title={label}>
                                    {label}
                                </Option>
                            ))}
                        </SelectTwo>
                    ) : (
                        planTitle
                    )
                }
                recommended={isRecommended}
                disabled={
                    loading ||
                    (isFree && !isSignupMode && isCurrentPlan) ||
                    (plan.ID === PLANS.FREE && !isFreeSubscription && subscription?.Renew === Renew.Disabled)
                }
                key={plan.ID}
                price={priceElement}
                features={featuresElement}
                onSelect={(planName) => {
                    // Mail plus users selecting free plan are redirected to the cancellation reminder flow
                    if (planName === PLANS.FREE && (b2bAccess || b2cAccess)) {
                        sendStartCancellationPricingReport();
                        redirectToCancellationFlow();
                        return;
                    }

                    onChangePlanIDs(
                        switchPlan({
                            subscription,
                            newPlan: isFree ? undefined : planName,
                            organization,
                            plans,
                        }),
                        cycle,
                        plan.Currency
                    );
                }}
            />
        );
    };

    const renderShortPlanCard = (plan: ShortPlanLike) => {
        return (
            // this render contains some assumptions that are valid only because we currently have the only UI plan.
            // If we get more later, then this code must be generalized. Examples: "Let's talk" price might be
            // different, so is the actionElement.
            <PlanCard
                isCurrentPlan={false}
                actionElement={<VpnEnterpriseAction />}
                enableActionLabelSpacing={isVpnB2bPlans && audience === Audience.B2B}
                info={plan.description}
                planName={plan.plan as any}
                planTitle={plan.title}
                recommended={false}
                key={plan.plan}
                price={
                    // translator: displayed instead of price for VPN Enterprise plan. User should contact Sales first.
                    c('Action').t`Let's talk`
                }
                features={<PlanCardFeatureList features={plan.features} icon />}
            />
        );
    };

    const passLifetimePlan = plansMap[PLANS.PASS_LIFETIME];

    const tabs: Tab[] = [
        IndividualPlans.length > 0 && {
            title: c('Tab subscription modal').t`For individuals`,
            content: (
                <>
                    {lifetimeSelected && passLifetimePlan ? (
                        <div
                            className="plan-selection plan-selection--b2c mt-4 plan-selection--one-plan-narrow"
                            style={{ '--plan-selection-number': 3 }}
                            data-testid="lifetime-plan-cycle"
                        >
                            {renderPlanCard(
                                passLifetimePlan,
                                Audience.B2C,
                                [],
                                IndividualPlans.filter((plan): plan is Plan => !isShortPlanLike(plan))
                            )}
                        </div>
                    ) : (
                        <div
                            className={clsx(
                                'plan-selection plan-selection--b2c mt-4',
                                IndividualPlans.length === 1 && 'plan-selection--one-plan'
                            )}
                            style={{ '--plan-selection-number': IndividualPlans.length }}
                            data-testid="b2c-plan"
                        >
                            {IndividualPlans.map((plan) =>
                                renderPlanCard(
                                    plan as Plan,
                                    Audience.B2C,
                                    b2cRecommendedPlans,
                                    IndividualPlans.filter((plan): plan is Plan => !isShortPlanLike(plan))
                                )
                            )}
                        </div>
                    )}
                </>
            ),
            audience: Audience.B2C,
        },
        FamilyPlans.length > 0 && {
            title: c('Tab subscription modal').t`For families`,
            content: (
                <div
                    className={clsx(
                        'plan-selection plan-selection--family mt-4',
                        FamilyPlans.length === 1 && 'plan-selection--one-plan'
                    )}
                    style={{ '--plan-selection-number': FamilyPlans.length }}
                >
                    {FamilyPlans.map((plan) =>
                        renderPlanCard(plan, Audience.FAMILY, familyRecommendedPlans, FamilyPlans)
                    )}
                </div>
            ),
            audience: Audience.FAMILY,
        },
        B2BPlans.length > 0 && {
            title: c('Tab subscription modal').t`For businesses`,
            content: (
                <div
                    className={clsx(
                        'plan-selection plan-selection--b2b mt-4',
                        B2BPlans.length === 1 && 'plan-selection--one-plan'
                    )}
                    style={{ '--plan-selection-number': B2BPlans.length }}
                    data-testid="b2b-plan"
                >
                    {B2BPlans.map((plan) => {
                        if (isShortPlanLike(plan)) {
                            return renderShortPlanCard(plan);
                        } else {
                            return renderPlanCard(
                                plan,
                                Audience.B2B,
                                b2bRecommendedPlans,
                                B2BPlans.filter((it): it is Plan => !isShortPlanLike(it))
                            );
                        }
                    })}
                </div>
            ),
            audience: Audience.B2B,
        },
    ].filter((tab): tab is Tab => {
        if (!tab) {
            return false;
        }
        return filter?.includes(tab.audience) ?? true;
    });

    useEffect(() => {
        if (!availableCurrencies.includes(currency)) {
            onChangeCurrency(availableCurrencies[0]);
        }
    }, [availableCurrencies, currency]);

    const currencyItem = (
        <div className="flex flex-row flex-nowrap items-center">
            {isRegionalCurrency(currency) && (
                <Info className="mx-2" title={c('Payments').t`More plans are available in other currencies`} />
            )}
            <div className="w-8">
                <CurrencySelector
                    mode="select-two"
                    currencies={availableCurrencies}
                    currency={currency}
                    onSelect={onChangeCurrency}
                    disabled={loading}
                />
            </div>
        </div>
    );

    const currencySelectorRow = (
        <div className="flex justify-space-between flex-column md:flex-row">
            <div className="hidden lg:inline-block visibility-hidden">{currencyItem}</div>
            <div className="flex justify-center w-full lg:w-auto">
                {renderCycleSelector && (
                    <CycleSelector
                        mode="buttons"
                        cycle={restrictedCycle}
                        lifetimeSelected={lifetimeSelected}
                        onSelect={(cycle) => {
                            if (cycle === 'lifetime') {
                                setLifetimeSelected(true);
                                return;
                            }

                            setLifetimeSelected(false);
                            onChangeCycle(cycle);
                        }}
                        disabled={loading}
                        minimumCycle={maybeMinimumCycle}
                        maximumCycle={maximumCycle}
                        options={cycleSelectorOptions}
                        additionalOptions={
                            isPassLifetimeEligible
                                ? [
                                      {
                                          text: c('Billing cycle option').t`Lifetime`,
                                          value: 'lifetime',
                                      },
                                  ]
                                : undefined
                        }
                    />
                )}
            </div>
            <div className="mx-auto lg:mx-0 mt-4 lg:mt-0">{currencyItem}</div>
        </div>
    );

    const logosRow = (
        <div className="my-6 flex justify-center flex-nowrap items-center color-weak">
            <MailLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <CalendarLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <DriveLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <VpnLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <PassLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <WalletLogo variant="glyph-only" />
        </div>
    );

    const tabNumberToAudience = (tabNumber: number): Audience => {
        return tabs[tabNumber].audience ?? Audience.B2C;
    };

    const audienceToTabNumber = (audience: Audience): number => {
        const tabIndex = tabs.findIndex((tab) => tab.audience === audience);
        return tabIndex !== -1 ? tabIndex : 0;
    };

    return (
        <>
            <div className="mb-6">
                <Tabs
                    value={audienceToTabNumber(audience)}
                    onChange={(tabNumber) => onChangeAudience(tabNumberToAudience(tabNumber))}
                    tabs={tabs}
                    fullWidth={true}
                    containerClassName="inline-block"
                    navContainerClassName="text-center lg-text-nowrap"
                    gap={
                        mode === 'settings' ? (
                            <>
                                {logosRow}
                                {currencySelectorRow}
                            </>
                        ) : (
                            <div className="mt-6">{currencySelectorRow}</div>
                        )
                    }
                />
            </div>
        </>
    );
};
export default PlanSelection;
