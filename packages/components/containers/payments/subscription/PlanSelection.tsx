import { c } from 'ttag';

import { CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import {
    Audience,
    Currency,
    Cycle,
    Organization,
    Plan,
    PlanIDs,
    PlansMap,
    Subscription,
    VPNCountries,
    VPNServers,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import isTruthy from '@proton/utils/isTruthy';

import { CalendarLogo, DriveLogo, Icon, MailLogo, Option, SelectTwo, Tabs, VpnLogo } from '../../../components';
import CurrencySelector from '../CurrencySelector';
import CycleSelector from '../CycleSelector';
import { getAllFeatures } from '../features';
import { getShortPlan } from '../features/plan';
import PlanCard from './PlanCard';
import PlanCardFeatures, { PlanCardFeaturesShort } from './PlanCardFeatures';

import './PlanSelection.scss';

export interface SelectedProductPlans {
    [Audience.B2C]: PLANS;
    [Audience.B2B]: PLANS;
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

interface Props {
    planIDs: PlanIDs;
    currency: Currency;
    hasPlanSelectionComparison?: boolean;
    hasFreePlan?: boolean;
    cycle: Cycle;
    plans: Plan[];
    plansMap: PlansMap;
    vpnServers: VPNServers;
    vpnCountries: VPNCountries;
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
}

const PlanSelection = ({
    mode,
    hasFreePlan = true,
    planIDs,
    plans,
    plansMap,
    vpnServers,
    vpnCountries,
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
}: Props) => {
    const currentPlan = subscription ? subscription.Plans?.find(({ Type }) => Type === PLAN_TYPES.PLAN) : null;

    const enabledProductB2CPlans = [PLANS.MAIL, PLANS.VPN, PLANS.DRIVE];
    const enabledProductB2BPlans = [PLANS.MAIL_PRO /*, PLANS.DRIVE_PRO*/];

    const B2CPlans = [
        hasFreePlan ? FREE_PLAN : null,
        getPlanPanel(enabledProductB2CPlans, selectedProductPlans[Audience.B2C], plansMap) || plansMap[PLANS.MAIL],
        plansMap[PLANS.BUNDLE],
    ].filter(isTruthy);

    const B2BPlans = [
        hasFreePlan ? FREE_PLAN : null,
        getPlanPanel(enabledProductB2BPlans, selectedProductPlans[Audience.B2B], plansMap) || plansMap[PLANS.MAIL_PRO],
        plansMap[PLANS.BUNDLE_PRO],
    ].filter(isTruthy);

    const isSignupMode = mode === 'signup';
    const features = getAllFeatures(plansMap, vpnCountries, vpnServers);

    const plansListB2C = getPlansList(enabledProductB2CPlans, plansMap);
    const recommendedPlans = [PLANS.BUNDLE, PLANS.BUNDLE_PRO];

    const renderPlanCard = (plan: Plan, audience: Audience) => {
        const isFree = plan.ID === PLANS.FREE;
        const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
        const isRecommended = recommendedPlans.includes(plan.Name as PLANS);
        const shortPlan = getShortPlan(plan.Name as PLANS, plansMap, vpnCountries, vpnServers);

        if (!shortPlan) {
            return null;
        }

        const planTitle = shortPlan.title;
        const selectedPlanLabel = isFree ? c('Action').t`Current plan` : c('Action').t`Edit subscription`;
        const actionLabel = isCurrentPlan ? selectedPlanLabel : c('Action').t`Select ${planTitle}`;

        const plansList = audience === Audience.B2C ? plansListB2C : [];
        const isSelectable = plansList.some(({ planName: otherPlanName }) => otherPlanName === plan.Name);
        const selectedPlan = plansList.some(
            ({ planName: otherPlanName }) => otherPlanName === selectedProductPlans[audience]
        )
            ? selectedProductPlans[audience]
            : plansList[0]?.planName;

        const price = plan.Pricing[cycle];
        if (price === undefined) {
            return null;
        }

        return (
            <PlanCard
                isCurrentPlan={!isSignupMode && isCurrentPlan}
                action={actionLabel}
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
                features={
                    mode === 'settings' ? (
                        <PlanCardFeaturesShort plan={shortPlan} icon />
                    ) : (
                        <PlanCardFeatures audience={audience} features={features} planName={plan.Name as PLANS} />
                    )
                }
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

    const tabs = [
        {
            title: c('Tab subscription modal').t`For individuals`,
            content: (
                <div
                    className="plan-selection plan-selection--b2c mt1"
                    style={{ '--plan-selection-number': B2CPlans.length }}
                >
                    {B2CPlans.map((plan) => renderPlanCard(plan, Audience.B2C))}
                </div>
            ),
        },
        {
            title: c('Tab subscription modal').t`For businesses`,
            content: (
                <div
                    className="plan-selection plan-selection--b2b mt1"
                    style={{ '--plan-selection-number': B2BPlans.length }}
                >
                    {B2BPlans.map((plan) => renderPlanCard(plan, Audience.B2B))}
                </div>
            ),
        },
    ];

    const currencyItem = (
        <CurrencySelector mode="select-two" currency={currency} onSelect={onChangeCurrency} disabled={loading} />
    );
    const currencySelectorRow = (
        <div className="flex flex-justify-space-between on-mobile-flex-column-nostretch">
            <div className="inline-block no-mobile visibility-hidden">{currencyItem}</div>
            <div className="flex on-mobile-flex on-mobile-flex-justify-center on-mobile-w100">
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
            <div className="flex on-mobile-center on-mobile-mt1">{currencyItem}</div>
        </div>
    );

    const logosRow = (
        <div className="mt2 mb2 flex flex-justify-center flex-nowrap flex-align-items-center color-weak">
            <MailLogo />
            <Icon name="plus" alt="+" className="mx0-5" />
            <CalendarLogo />
            <Icon name="plus" alt="+" className="mx0-5" />
            <DriveLogo />
            <Icon name="plus" alt="+" className="mx0-5" />
            <VpnLogo />
        </div>
    );

    return (
        <>
            <div className="mb2">
                <Tabs
                    value={audience === Audience.B2C ? 0 : 1}
                    onChange={(newValue) => {
                        onChangeAudience(newValue === 0 ? Audience.B2C : Audience.B2B);
                    }}
                    tabs={tabs}
                    containerClassName="inline-block"
                    navContainerClassName="text-center"
                    gap={
                        mode === 'settings' ? (
                            <>
                                {logosRow}
                                {currencySelectorRow}
                            </>
                        ) : (
                            <div className="mt1">{currencySelectorRow}</div>
                        )
                    }
                />
            </div>
        </>
    );
};
export default PlanSelection;
