import { ReactElement } from 'react';

import { c } from 'ttag';

import { ProductParam } from '@proton/shared/lib/apps/product';
import { ADDON_NAMES, APPS, CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { getIpPricePerMonth } from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    Currency,
    Cycle,
    Organization,
    Plan,
    PlanIDs,
    PlansMap,
    Subscription,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
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
} from '../../../components';
import CurrencySelector from '../CurrencySelector';
import CycleSelector from '../CycleSelector';
import { getAllFeatures } from '../features';
import { ShortPlanLike, isShortPlanLike } from '../features/interface';
import { getShortPlan, getVPNEnterprisePlan } from '../features/plan';
import PlanCard from './PlanCard';
import PlanCardFeatures, { PlanCardFeatureList, PlanCardFeaturesShort } from './PlanCardFeatures';
import VpnEnterpriseAction from './helpers/VpnEnterpriseAction';

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
    plans: Plan[];
    plansMap: PlansMap;
    vpnServers: VPNServersCountData;
    loading?: boolean;
    mode: 'signup' | 'settings' | 'modal';
    onChangePlanIDs: (newPlanIDs: PlanIDs) => void;
    onChangeCurrency: (newCurrency: Currency) => void;
    onChangeCycle: (newCyle: Cycle) => void;
    audience: Audience;
    onChangeAudience: (newAudience: Audience) => void;
    selectedProductPlans: SelectedProductPlans;
    onChangeSelectedProductPlans: (newPlans: SelectedProductPlans) => void;
    subscription?: Subscription;
    organization?: Organization;
    calendarSharingEnabled: boolean;
    sentinelPassplusEnabled: boolean;
    filter?: Audience[];
}

export const getPrice = (plan: Plan, cycle: Cycle, plansMap: PlansMap): number | null => {
    const price = plan.Pricing[cycle];
    if (price === undefined) {
        return null;
    }

    const plansThatMustUseAddonPricing = {
        [PLANS.VPN_PRO]: ADDON_NAMES.MEMBER_VPN_PRO,
        [PLANS.VPN_BUSINESS]: ADDON_NAMES.MEMBER_VPN_BUSINESS,
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
        const memberPrice = memberAddon?.Pricing[cycle];
        if (memberPrice === undefined) {
            continue;
        }

        return memberPrice;
    }

    return price;
};

const ActionLabel = ({ plan, currency, cycle }: { plan: Plan; currency: Currency; cycle: Cycle }) => {
    const serverPrice = <Price currency={currency}>{getIpPricePerMonth(cycle)}</Price>;
    // translator: example of full sentence: "VPN Business requires at least 1 dedicated server (CHF 39.99 /month)"
    const serverPriceStr = c('Info').jt`(${serverPrice} /month)`;
    const serverPricePerMonth = <span className="text-nowrap">{serverPriceStr}</span>;

    return (
        <div className="mt-6 flex flex-nowrap color-weak">
            <div className="flex-item-noshrink mr-2">
                <Icon name="info-circle" />
            </div>
            <div>{c('Info').jt`${plan.Title} requires at least 1 dedicated server ${serverPricePerMonth}`}</div>
        </div>
    );
};

const PlanSelection = ({
    app,
    mode,
    hasFreePlan = true,
    planIDs,
    plans,
    plansMap,
    vpnServers,
    cycle,
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
    calendarSharingEnabled,
    sentinelPassplusEnabled,
    filter,
}: Props) => {
    const isVpnSettingsApp = app == APPS.PROTONVPN_SETTINGS;
    const currentPlan = subscription ? subscription.Plans?.find(({ Type }) => Type === PLAN_TYPES.PLAN) : null;

    const enabledProductB2CPlans = [PLANS.MAIL, PLANS.VPN, PLANS.DRIVE, PLANS.PASS_PLUS].filter(isTruthy);
    const enabledProductB2BPlans = [PLANS.MAIL_PRO /*, PLANS.DRIVE_PRO*/];

    const B2CPlans = [
        hasFreePlan ? FREE_PLAN : null,
        getPlanPanel(enabledProductB2CPlans, selectedProductPlans[Audience.B2C], plansMap) || plansMap[PLANS.MAIL],
        plansMap[PLANS.BUNDLE],
    ].filter(isTruthy);

    const FamilyPlans = [hasFreePlan ? FREE_PLAN : null, plansMap[PLANS.FAMILY]].filter(isTruthy);

    const vpnB2BPlans = [
        plansMap[PLANS.VPN_PRO],
        plansMap[PLANS.VPN_BUSINESS],
        getVPNEnterprisePlan(vpnServers),
    ].filter(isTruthy);

    let B2BPlans: (Plan | ShortPlanLike)[] = [];

    /**
     * The VPN B2B plans should be displayed only in the ProtonVPN Settings app (protonvpn.com).
     *
     * The check for length of plans is needed for the case if the VPN B2B plans are not available.
     * Then we should fallback to the usual set of plans. It can happen if backend doesn't return the VPN B2B plans.
     */
    const isVpnB2bPlans = isVpnSettingsApp && vpnB2BPlans.length !== 0;

    if (isVpnB2bPlans) {
        B2BPlans = vpnB2BPlans;
    } else {
        B2BPlans = [
            hasFreePlan ? FREE_PLAN : null,
            getPlanPanel(enabledProductB2BPlans, selectedProductPlans[Audience.B2B], plansMap) ||
                plansMap[PLANS.MAIL_PRO],
            plansMap[PLANS.BUNDLE_PRO],
        ].filter(isTruthy);
    }

    const isSignupMode = mode === 'signup';
    const features = getAllFeatures({
        plansMap,
        serversCount: vpnServers,
        calendarSharingEnabled,
        sentinelPassplusEnabled,
    });

    const plansListB2C = getPlansList(enabledProductB2CPlans, plansMap);
    const recommendedPlans = [PLANS.BUNDLE, PLANS.BUNDLE_PRO, PLANS.FAMILY];

    const renderPlanCard = (plan: Plan, audience: Audience) => {
        const isFree = plan.ID === PLANS.FREE;
        const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
        const isRecommended = recommendedPlans.includes(plan.Name as PLANS);
        const shortPlan = getShortPlan(plan.Name as PLANS, plansMap, { vpnServers, sentinelPassplusEnabled });

        if (!shortPlan) {
            return null;
        }

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
            mode === 'settings' || (audience === Audience.B2B && isVpnSettingsApp) ? (
                <PlanCardFeaturesShort plan={shortPlan} icon />
            ) : (
                <PlanCardFeatures audience={audience} features={features} planName={plan.Name as PLANS} />
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
                disabled={loading || (isFree && !isSignupMode && isCurrentPlan)}
                cycle={cycle}
                key={plan.ID}
                price={price}
                features={featuresElement}
                onSelect={(planName) => {
                    onChangePlanIDs(
                        switchPlan({
                            planIDs,
                            planID: isFree ? undefined : planName,
                            organization,
                            plans,
                        })
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
                cycle={cycle}
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
        {
            title: c('Tab subscription modal').t`For individuals`,
            content: (
                <div
                    className="plan-selection plan-selection--b2c mt-4"
                    style={{ '--plan-selection-number': B2CPlans.length }}
                    data-testid="b2c-plan"
                >
                    {B2CPlans.map((plan) => renderPlanCard(plan, Audience.B2C))}
                </div>
            ),
            audience: Audience.B2C,
        },
        {
            title: c('Tab subscription modal').t`For families`,
            content: (
                <div
                    className="plan-selection plan-selection--family mt-4"
                    style={{ '--plan-selection-number': FamilyPlans.length }}
                >
                    {FamilyPlans.map((plan) => renderPlanCard(plan, Audience.FAMILY))}
                </div>
            ),
            audience: Audience.FAMILY,
        },
        {
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
                            return renderPlanCard(plan, Audience.B2B);
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
        <div className="flex flex-justify-space-between on-mobile-flex-column-nostretch">
            <div className="inline-block no-mobile visibility-hidden">{currencyItem}</div>
            <div className="flex on-mobile-flex on-mobile-flex-justify-center w-full md:w-auto">
                <CycleSelector
                    mode="buttons"
                    cycle={cycle}
                    onSelect={onChangeCycle}
                    disabled={loading}
                    options={[
                        { text: c('Billing cycle option').t`1 month`, value: CYCLE.MONTHLY },
                        { text: c('Billing cycle option').t`12 months`, value: CYCLE.YEARLY },
                        { text: c('Billing cycle option').t`24 months`, value: CYCLE.TWO_YEARS },
                    ]}
                />
            </div>
            <div className="flex mx-auto md:mx-0 mt-4 md:mt-0">{currencyItem}</div>
        </div>
    );

    const logosRow = (
        <div className="my-6 flex flex-justify-center flex-nowrap flex-align-items-center color-weak">
            <MailLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <CalendarLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <DriveLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <VpnLogo variant="glyph-only" />
            <Icon name="plus" alt="+" className="mx-2" />
            <PassLogo variant="glyph-only" />
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
