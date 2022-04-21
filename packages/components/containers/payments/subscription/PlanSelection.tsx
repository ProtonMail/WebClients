import { c } from 'ttag';
import { Audience, Currency, Cycle, Plan, PlanIDs, Subscription } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';
import { CYCLE, PLAN_NAMES, PLAN_TYPES, PLANS } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { CalendarLogo, DriveLogo, MailLogo, Tabs, VpnLogo, Icon } from '../../../components';
import { useVPNCountriesCount, useVPNServersCount } from '../../../hooks';
import { getShortPlan } from '../features/plan';
import { getAllFeatures } from '../features';
import CurrencySelector from '../CurrencySelector';
import PlanCard from './PlanCard';
import PlanCardFeatures, { PlanCardFeaturesShort } from './PlanCardFeatures';
import './PlanSelection.scss';
import CycleSelector from '../CycleSelector';

export interface SelectedProductPlans {
    [Audience.B2C]: PLANS;
    [Audience.B2B]: PLANS;
}

interface Props {
    planIDs: PlanIDs;
    currency: Currency;
    hasPlanSelectionComparison?: boolean;
    hasFreePlan?: boolean;
    cycle: Cycle;
    plans: Plan[];
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
}

const PlanSelection = ({
    mode,
    hasFreePlan = true,
    planIDs,
    plans,
    cycle,
    currency,
    loading,
    subscription,
    onChangePlanIDs,
    onChangeCurrency,
    onChangeCycle,
    audience,
    onChangeAudience,
    selectedProductPlans,
    onChangeSelectedProductPlans,
}: Props) => {
    const currentPlan = subscription ? subscription.Plans?.find(({ Type }) => Type === PLAN_TYPES.PLAN) : null;
    const plansMap = toMap(plans, 'Name');
    const [vpnServers] = useVPNServersCount();
    const [vpnCountries] = useVPNCountriesCount();

    const B2CPlans = [
        hasFreePlan ? FREE_PLAN : null,
        selectedProductPlans[Audience.B2C] === PLANS.MAIL && plansMap[PLANS.MAIL],
        selectedProductPlans[Audience.B2C] === PLANS.VPN && plansMap[PLANS.VPN],
        // selectedProductPlans[Audience.B2C] === PLANS.DRIVE && plansMap[PLANS.DRIVE],
        plansMap[PLANS.BUNDLE],
    ].filter(isTruthy);

    const B2BPlans = [
        hasFreePlan ? FREE_PLAN : null,
        selectedProductPlans[Audience.B2B] === PLANS.MAIL_PRO && plansMap[PLANS.MAIL_PRO],
        // selectedPlan === PLANS.DRIVE_PRO && plansMap[PLANS.DRIVE_PRO],
        plansMap[PLANS.BUNDLE_PRO],
        // plansMap[PLANS.ENTERPRISE],
    ].filter(isTruthy);

    const isSignupMode = mode === 'signup';
    const features = getAllFeatures(plansMap, vpnCountries, vpnServers);

    const renderPlanCard = (plan: Plan, audience: Audience) => {
        const isFree = plan.ID === PLANS.FREE;
        const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
        const isRecommended = [PLANS.BUNDLE, PLANS.BUNDLE_PRO].includes(plan.Name as PLANS);
        const canSelect = [PLANS.MAIL, PLANS.VPN, PLANS.DRIVE].includes(plan.Name as PLANS);
        const selectedPlanLabel = isFree ? c('Action').t`Current plan` : c('Action').t`Edit subscription`;
        const planTitle = PLAN_NAMES[plan.Name as PLANS];
        const actionLabel = isCurrentPlan ? selectedPlanLabel : c('Action').t`Select ${planTitle}`;
        const shortPlan = getShortPlan(plan.Name as PLANS, plansMap, vpnCountries, vpnServers);

        if (!shortPlan) {
            return null;
        }

        return (
            <PlanCard
                target={audience}
                isCurrentPlan={!isSignupMode && isCurrentPlan}
                action={actionLabel}
                planTitle={planTitle}
                info={shortPlan.description}
                planName={plan.Name as PLANS}
                canSelect={canSelect}
                recommended={isRecommended}
                currency={currency}
                disabled={loading || (isFree && !isSignupMode && isCurrentPlan)}
                cycle={cycle}
                key={plan.ID}
                price={plan.Pricing[cycle]}
                features={
                    mode === 'settings' ? (
                        <PlanCardFeaturesShort plan={shortPlan} icon />
                    ) : (
                        <PlanCardFeatures audience={audience} features={features} planName={plan.Name as PLANS} />
                    )
                }
                selectedPlan={selectedProductPlans[audience]}
                onSelectPlan={(plan) => {
                    onChangeSelectedProductPlans({ ...selectedProductPlans, [audience]: plan });
                }}
                onSelect={(planName) => {
                    onChangePlanIDs(
                        switchPlan({
                            planIDs,
                            planID: isFree ? undefined : planName,
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
        <div className="flex flex-justify-space-between">
            <div className="inline-block visibility-hidden">{currencyItem}</div>
            <div className="inline-block">
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
            <div className="inline-block">{currencyItem}</div>
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
