import { c } from 'ttag';
import { Audience, Currency, Cycle, Plan, PlanIDs, Subscription } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';
import { PLAN_NAMES, PLAN_TYPES, PLANS } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { hasVisionary } from '@proton/shared/lib/helpers/subscription';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { CalendarLogo, DriveLogo, MailLogo, Tabs, VpnLogo } from '../../../components';
import { useVPNCountriesCount, useVPNServersCount } from '../../../hooks';
import { getShortPlan } from '../features/plan';
import { getAllFeatures } from '../features';
import CurrencySelector from '../CurrencySelector';
import PlanCard from './PlanCard';
import PlanCardFeatures, { PlanCardFeaturesShort } from './PlanCardFeatures';
import './PlanSelection.scss';

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
        subscription && hasVisionary(subscription) ? plansMap[PLANS.NEW_VISIONARY] : null,
    ].filter(isTruthy);

    const B2BPlans = [
        hasFreePlan ? FREE_PLAN : null,
        selectedProductPlans[Audience.B2B] === PLANS.MAIL_PRO && plansMap[PLANS.MAIL_PRO],
        // selectedPlan === PLANS.DRIVE_PRO && plansMap[PLANS.DRIVE_PRO],
        plansMap[PLANS.BUNDLE_PRO],
        // plansMap[PLANS.ENTERPRISE],
    ].filter(isTruthy);

    const isSignupMode = mode === 'signup';
    const features = getAllFeatures(vpnCountries, vpnServers);

    const renderPlanCard = (plan: Plan, audience: Audience) => {
        const isFree = plan.ID === PLANS.FREE;
        const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
        const isRecommended = [PLANS.BUNDLE, PLANS.BUNDLE_PRO].includes(plan.Name as PLANS);
        const canSelect = [PLANS.MAIL, PLANS.VPN, PLANS.DRIVE].includes(plan.Name as PLANS);
        const selectedPlanLabel = isFree ? c('Action').t`Current plan` : c('Action').t`Edit subscription`;
        const actionLabel = isCurrentPlan ? selectedPlanLabel : c('Action').t`Select`;
        const shortPlan = getShortPlan(plan.Name as PLANS, vpnCountries, vpnServers);

        if (!shortPlan) {
            return null;
        }

        return (
            <PlanCard
                target={audience}
                isCurrentPlan={!isSignupMode && isCurrentPlan}
                action={actionLabel}
                planTitle={PLAN_NAMES[plan.Name as PLANS]}
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
                        <PlanCardFeaturesShort plan={shortPlan} />
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
                    {B2BPlans.map((plan) => renderPlanCard(plan, Audience.B2B))},
                </div>
            ),
        },
    ];

    const currencySelectorRow = (
        <div className="text-right">
            <CurrencySelector mode="buttons" currency={currency} onSelect={onChangeCurrency} disabled={loading} />
        </div>
    );

    const logosRow = (
        <div className="mt1 flex flex-justify-center flex-nowrap flex-align-items-center color-weak">
            <MailLogo />
            +
            <CalendarLogo />
            +
            <DriveLogo />
            +
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
                            <>{currencySelectorRow}</>
                        )
                    }
                />
            </div>
        </>
    );
};
export default PlanSelection;
