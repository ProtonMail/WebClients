import type { ReactElement } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/components/hooks';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { FreeSubscription } from '@proton/shared/lib/constants';
import {
    ADDON_NAMES,
    APPS,
    CYCLE,
    PLANS,
    PLAN_TYPES,
    isFreeSubscription as getIsFreeSubscription,
} from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import {
    getCanSubscriptionAccessDuoPlan,
    getIpPricePerMonth,
    getPricePerCycle,
    hasMaximumCycle,
    hasSomeAddonOrPlan,
} from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    type Currency,
    type Cycle,
    type FreePlanDefault,
    type Organization,
    type Plan,
    type PlanIDs,
    type PlansMap,
    Renew,
    type SubscriptionModel,
    type VPNServersCountData,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import {
    CalendarLogo,
    DriveLogo,
    Icon,
    MailLogo,
    Option,
    PassLogo,
    Price,
    SelectTwo,
    Tabs,
    VpnLogo,
    WalletLogo,
} from '../../../components';
import CurrencySelector from '../CurrencySelector';
import CycleSelector, { getRestrictedCycle } from '../CycleSelector';
import { getAllFeatures } from '../features';
import type { ShortPlanLike } from '../features/interface';
import { isShortPlanLike } from '../features/interface';
import { getShortPlan, getVPNEnterprisePlan } from '../features/plan';
import PlanCard from './PlanCard';
import PlanCardFeatures, { PlanCardFeatureList, PlanCardFeaturesShort } from './PlanCardFeatures';
import { useCancellationFlow } from './cancellationFlow';
import useCancellationTelemetry from './cancellationFlow/useCancellationTelemetry';
import VpnEnterpriseAction from './helpers/VpnEnterpriseAction';
import { getBundleProPlanToUse, getVPNPlanToUse, notHigherThanAvailableOnBackend } from './helpers/payment';

import './PlanSelection.scss';

export interface SelectedProductPlans {
    [Audience.B2C]: PLANS;
    [Audience.B2B]: PLANS;
    [Audience.FAMILY]: PLANS;
}

const getPlansList = (enabledProductPlans: PLANS[], plansMap: PlansMap) => {
    return enabledProductPlans
        .map((planName) => {
            const plan = plansMap[planName];
            if (plan) {
                return {
                    planName,
                    label: plan.Title,
                };
            }
        })
        .filter(isTruthy);
};

const getPlanPanel = (enabledProductPlans: PLANS[], planName: PLANS, plansMap: PlansMap) => {
    if (enabledProductPlans.includes(planName)) {
        return plansMap[planName];
    }
};

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
    plansMap: PlansMap;
    freePlan: FreePlanDefault;
    vpnServers: VPNServersCountData;
    loading?: boolean;
    mode: 'signup' | 'settings' | 'modal' | 'upsell-modal';
    onChangePlanIDs: (newPlanIDs: PlanIDs, cycle: Cycle) => void;
    onChangeCurrency: (newCurrency: Currency) => void;
    onChangeCycle: (newCyle: Cycle) => void;
    audience: Audience;
    onChangeAudience: (newAudience: Audience) => void;
    selectedProductPlans: SelectedProductPlans;
    onChangeSelectedProductPlans: (newPlans: SelectedProductPlans) => void;
    subscription?: SubscriptionModel | FreeSubscription;
    organization?: Organization;
    filter?: Audience[];
}

export const getPrice = (plan: Plan, cycle: Cycle, plansMap: PlansMap): number | null => {
    const price = getPricePerCycle(plan, cycle);
    if (price === undefined) {
        return null;
    }

    const plansThatMustUseAddonPricing = {
        [PLANS.VPN_PRO]: ADDON_NAMES.MEMBER_VPN_PRO,
        [PLANS.VPN_BUSINESS]: ADDON_NAMES.MEMBER_VPN_BUSINESS,
        [PLANS.PASS_PRO]: ADDON_NAMES.MEMBER_PASS_PRO,
        [PLANS.PASS_BUSINESS]: ADDON_NAMES.MEMBER_PASS_BUSINESS,
    };
    type PlanWithAddon = keyof typeof plansThatMustUseAddonPricing;

    // If the current plan is one of those that must use addon pricing,
    // then we find the matching addon object and return its price
    for (const planWithAddon of Object.keys(plansThatMustUseAddonPricing) as PlanWithAddon[]) {
        if (plan.Name !== planWithAddon) {
            continue;
        }

        const addonName = plansThatMustUseAddonPricing[planWithAddon];
        const memberAddon = plansMap[addonName];
        const memberPrice = memberAddon ? getPricePerCycle(memberAddon, cycle) : undefined;
        if (memberPrice === undefined) {
            continue;
        }

        return memberPrice;
    }

    return price;
};

const getCycleSelectorOptions = (app: ProductParam) => {
    const oneMonth = { text: c('Billing cycle option').t`1 month`, value: CYCLE.MONTHLY };
    const oneYear = { text: c('Billing cycle option').t`12 months`, value: CYCLE.YEARLY };
    const twoYears = { text: c('Billing cycle option').t`24 months`, value: CYCLE.TWO_YEARS };

    if (app !== APPS.PROTONVPN_SETTINGS) {
        return [oneMonth, oneYear];
    }

    return [oneMonth, oneYear, twoYears];
};

const ActionLabel = ({ plan, currency, cycle }: { plan: Plan; currency: Currency; cycle: Cycle }) => {
    const serverPrice = <Price currency={currency}>{getIpPricePerMonth(cycle)}</Price>;
    // translator: example of full sentence: "VPN Business requires at least 1 dedicated server (CHF 39.99 /month)"
    const serverPriceStr = c('Info').jt`(${serverPrice} /month)`;
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

const PlanSelection = ({
    app,
    mode,
    hasFreePlan,
    planIDs,
    plans,
    plansMap,
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
}: Props) => {
    const canAccessWalletPlan = useFlag('WalletPlan');
    const canAccessDriveBusinessPlan = useFlag('DriveBizPlan');
    const canAccessDuoPlan = useFlag('DuoPlan') && getCanSubscriptionAccessDuoPlan(subscription);

    const [user] = useUser();
    const isVpnSettingsApp = app == APPS.PROTONVPN_SETTINGS;
    const isPassSettingsApp = app == APPS.PROTONPASS;
    const isDriveSettingsApp = app == APPS.PROTONDRIVE;
    const currentPlan = subscription ? subscription.Plans?.find(({ Type }) => Type === PLAN_TYPES.PLAN) : null;
    const isFreeSubscription = getIsFreeSubscription(subscription);
    const renderCycleSelector = isFreeSubscription;
    const enabledProductB2CPlans = [
        PLANS.MAIL,
        getVPNPlanToUse({ plansMap, planIDs, cycle: subscription?.Cycle }),
        PLANS.DRIVE,
        PLANS.PASS,
        canAccessWalletPlan && PLANS.WALLET,
    ].filter(isTruthy);

    const bundleProPlan = getBundleProPlanToUse({ plansMap, planIDs });

    const { b2bAccess, b2cAccess, redirectToCancellationFlow } = useCancellationFlow();
    const { sendStartCancellationPricingReport } = useCancellationTelemetry();

    const alreadyHasMaxCycle = hasMaximumCycle(subscription);

    let maximumCycle: Cycle | undefined = maybeMaximumCycle;
    if (audience === Audience.B2B) {
        if (maybeMaximumCycle !== undefined) {
            maximumCycle = Math.min(maybeMaximumCycle, CYCLE.YEARLY);
        } else {
            maximumCycle = CYCLE.YEARLY;
        }
    }

    const { cycle: restrictedCycle } = getRestrictedCycle({
        cycle: cycleProp,
        minimumCycle: maybeMinimumCycle,
        maximumCycle,
        options: getCycleSelectorOptions(app),
    });

    function excludingCurrentPlanWithMaxCycle(plan: Plan | ShortPlanLike): boolean {
        if (isShortPlanLike(plan)) {
            return true;
        }

        const isCurrentPlan = currentPlan?.ID === plan.ID;
        const shouldNotRenderCurrentPlan = isCurrentPlan && alreadyHasMaxCycle;
        return !shouldNotRenderCurrentPlan;
    }

    function excludingTheOnlyFreePlan(
        plan: Plan | ShortPlanLike,
        _: number,
        allPlans: (Plan | ShortPlanLike)[]
    ): boolean {
        return !(plan === FREE_PLAN && allPlans.length === 1);
    }

    function filterPlans(plans: (Plan | null | undefined)[]): Plan[];
    function filterPlans(plans: (Plan | ShortPlanLike | null | undefined)[]): (Plan | ShortPlanLike)[];
    function filterPlans(plans: (Plan | ShortPlanLike | null | undefined)[]): (Plan | ShortPlanLike)[] {
        return plans.filter(isTruthy).filter(excludingCurrentPlanWithMaxCycle).filter(excludingTheOnlyFreePlan);
    }

    let IndividualPlans = filterPlans([
        hasFreePlan ? FREE_PLAN : null,
        getPlanPanel(enabledProductB2CPlans, selectedProductPlans[Audience.B2C], plansMap) || plansMap[PLANS.MAIL],
        plansMap[PLANS.BUNDLE],
        canAccessDuoPlan ? plansMap[PLANS.DUO] : null,
    ]);

    let FamilyPlans = filterPlans([
        hasFreePlan ? FREE_PLAN : null,
        canAccessDuoPlan ? plansMap[PLANS.DUO] : null,
        plansMap[PLANS.FAMILY],
    ]);

    const vpnB2BPlans = filterPlans([
        plansMap[PLANS.VPN_PRO],
        plansMap[PLANS.VPN_BUSINESS],
        getVPNEnterprisePlan(vpnServers),
    ]);

    const passB2BPlans = filterPlans([
        plansMap[PLANS.PASS_PRO],
        plansMap[PLANS.PASS_BUSINESS],
        plansMap[bundleProPlan],
    ]);

    const driveB2BPlans = filterPlans([
        canAccessDriveBusinessPlan ? plansMap[PLANS.DRIVE_BUSINESS] : undefined,
        plansMap[bundleProPlan],
    ]);

    let B2BPlans: (Plan | ShortPlanLike)[] = [];

    /**
     * The VPN B2B plans should be displayed only in the ProtonVPN Settings app (protonvpn.com).
     *
     * The check for length of plans is needed for the case if the VPN B2B plans are not available.
     * Then we should fallback to the usual set of plans. It can happen if backend doesn't return the VPN B2B plans.
     */
    const isVpnB2bPlans = isVpnSettingsApp && vpnB2BPlans.length !== 0;
    const isPassB2bPlans = isPassSettingsApp && passB2BPlans.length !== 0;
    const isDriveB2bPlans = isDriveSettingsApp && driveB2BPlans.length !== 0;

    if (isVpnB2bPlans) {
        B2BPlans = vpnB2BPlans;
    } else if (isPassB2bPlans) {
        B2BPlans = passB2BPlans;
    } else if (isDriveB2bPlans) {
        B2BPlans = driveB2BPlans;
    } else {
        B2BPlans = filterPlans([plansMap[PLANS.MAIL_PRO], plansMap[PLANS.MAIL_BUSINESS], plansMap[bundleProPlan]]);
    }

    if (app === APPS.PROTONWALLET && !canAccessWalletPlan) {
        IndividualPlans = filterPlans([plansMap[PLANS.VISIONARY]]);
        FamilyPlans = [];
        B2BPlans = [];
    }

    const isSignupMode = mode === 'signup';
    const features = getAllFeatures({
        plansMap,
        serversCount: vpnServers,
        freePlan,
    });

    const plansListB2C = getPlansList(enabledProductB2CPlans, plansMap);

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
        PLANS.FAMILY,
    ].filter(isTruthy);

    const b2bRecommendedPlans = [PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024];
    const hasRecommended = new Set<Audience>();

    const renderPlanCard = (plan: Plan, audience: Audience, recommendedPlans: PLANS[]) => {
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
        const action = isCurrentPlan ? selectedPlanLabel : c('Action').t`Select ${planTitle}`;
        const actionLabel =
            plan.Name === PLANS.VPN_BUSINESS ? <ActionLabel plan={plan} currency={currency} cycle={cycle} /> : null;

        const plansList = audience === Audience.B2C ? plansListB2C : [];
        const isSelectable = plansList.some(({ planName: otherPlanName }) => otherPlanName === plan.Name);
        const selectedPlan = plansList.some(
            ({ planName: otherPlanName }) => otherPlanName === selectedProductPlans[audience]
        )
            ? selectedProductPlans[audience]
            : plansList[0]?.planName;

        const price = getPrice(plan, cycle, plansMap);
        if (price === null) {
            return null;
        }

        const featuresElement =
            mode === 'settings' || mode === 'upsell-modal' || (audience === Audience.B2B && isVpnSettingsApp) ? (
                <PlanCardFeaturesShort plan={shortPlan} icon />
            ) : (
                <PlanCardFeatures audience={audience} features={features} planName={shortPlan.plan} />
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
                currency={currency}
                disabled={
                    loading ||
                    (isFree && !isSignupMode && isCurrentPlan) ||
                    (plan.ID === PLANS.FREE && !isFreeSubscription && subscription?.Renew === Renew.Disabled)
                }
                cycle={cycle}
                key={plan.ID}
                price={price}
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
                            planIDs,
                            planID: isFree ? undefined : planName,
                            organization,
                            plans,
                            user,
                        }),
                        cycle
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
                currency={currency}
                cycle={restrictedCycle}
                key={plan.plan}
                price={
                    // translator: displayed instead of price for VPN Enterprise plan. User should contact Sales first.
                    c('Action').t`Let's talk`
                }
                features={<PlanCardFeatureList features={plan.features} icon />}
            />
        );
    };

    const tabs: Tab[] = [
        IndividualPlans.length > 0 && {
            title: c('Tab subscription modal').t`For individuals`,
            content: (
                <div
                    className="plan-selection plan-selection--b2c mt-4"
                    style={{ '--plan-selection-number': IndividualPlans.length }}
                    data-testid="b2c-plan"
                >
                    {IndividualPlans.map((plan) => renderPlanCard(plan, Audience.B2C, b2cRecommendedPlans))}
                </div>
            ),
            audience: Audience.B2C,
        },
        FamilyPlans.length > 0 && {
            title: c('Tab subscription modal').t`For families`,
            content: (
                <div
                    className="plan-selection plan-selection--family mt-4"
                    style={{ '--plan-selection-number': FamilyPlans.length }}
                >
                    {FamilyPlans.map((plan) => renderPlanCard(plan, Audience.FAMILY, familyRecommendedPlans))}
                </div>
            ),
            audience: Audience.FAMILY,
        },
        B2BPlans.length > 0 && {
            title: c('Tab subscription modal').t`For businesses`,
            content: (
                <div
                    className="plan-selection plan-selection--b2b mt-4"
                    style={{ '--plan-selection-number': B2BPlans.length }}
                    data-testid="b2b-plan"
                >
                    {B2BPlans.map((plan) => {
                        if (isShortPlanLike(plan)) {
                            return renderShortPlanCard(plan);
                        } else {
                            return renderPlanCard(plan, Audience.B2B, b2bRecommendedPlans);
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

    const currencyItem = (
        <CurrencySelector mode="select-two" currency={currency} onSelect={onChangeCurrency} disabled={loading} />
    );
    const currencySelectorRow = (
        <div className="flex justify-space-between flex-column md:flex-row">
            <div className="hidden lg:inline-block visibility-hidden">{currencyItem}</div>
            <div className="flex justify-center w-full lg:w-auto">
                {renderCycleSelector && (
                    <CycleSelector
                        mode="buttons"
                        cycle={restrictedCycle}
                        onSelect={onChangeCycle}
                        disabled={loading}
                        minimumCycle={maybeMinimumCycle}
                        maximumCycle={maximumCycle}
                        options={getCycleSelectorOptions(app)}
                    />
                )}
            </div>
            <div className="flex mx-auto lg:mx-0 mt-4 lg:mt-0">{currencyItem}</div>
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
            {canAccessWalletPlan && (
                <>
                    <Icon name="plus" alt="+" className="mx-2" />
                    <WalletLogo variant="glyph-only" />
                </>
            )}
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
