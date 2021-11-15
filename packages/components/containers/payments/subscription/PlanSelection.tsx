import { c } from 'ttag';
import { Audience, Currency, Cycle, Plan, PlanIDs, Subscription } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';
import { PLAN_NAMES, PLAN_TYPES, PLANS } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { hasVisionary } from '@proton/shared/lib/helpers/subscription';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { Tabs } from '../../../components';
import CurrencySelector from '../CurrencySelector';
import PlanCard from './PlanCard';
import PlanCardFeatures from './PlanCardFeatures';
import PlanCardLogos from './PlanCardLogos';

import './PlanSelection.scss';
import PlanSelectionComparison from './PlanSelectionComparison';
import { useVPNCountriesCount, useVPNServersCount } from '../../../hooks';

export interface SelectedProductPlans {
    [Audience.B2C]: PLANS;
    [Audience.B2B]: PLANS;
}

export const getPlansInfo = () => {
    return {
        [PLANS.FREE]: c('Plan description')
            .t`The no-cost starter account, designed to empower everyone with privacy by default.`,
        [PLANS.VPNBASIC]: '',
        [PLANS.VPNPLUS]: '',
        [PLANS.PLUS]: '',
        [PLANS.PROFESSIONAL]: '',
        [PLANS.VISIONARY]: '',
        [PLANS.MAIL]: c('Plan description')
            .t`The privacy-first mail and calendar solution for your everyday communication needs.`,
        [PLANS.DRIVE]: c('Plan description')
            .t`The safe and secure storage option for all your files with end-to-end encrypted protection.`,
        [PLANS.VPN]: c('Plan description')
            .t`The dedicated VPN solution that provides secure, unrestricted, high-speed access to the internet.`,
        [PLANS.BUNDLE]: c('Plan description').t`The ultimate privacy pack with access to all premium Proton services.`,
        [PLANS.FAMILY]: c('Plan description').t`The Proton privacy suite specially designed for families.`,
        [PLANS.NEW_VISIONARY]: c('Plan description')
            .t`The Proton privacy suite that thanks our early adopters for their continued support.`,
        [PLANS.MAIL_PRO]: c('Plan description')
            .t`For small and medium businesses that want to secure their email communications and meeting schedules.`,
        [PLANS.DRIVE_PRO]: '',
        [PLANS.BUNDLE_PRO]: c('Plan description')
            .t`For businesses that want an all-in-one offering to securely communicate via email, organize their day via calendar, share large files, and encrypt their internet connection.`,
        [PLANS.ENTERPRISE]: c('Plan description')
            .t`For data-heaver businesses that want an all-in-one offering including email, calendar, drive, and VPN to all of their historical documents and emails accross all teams.`,
    } as const;
};

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
    hasPlanSelectionComparison = true,
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
        selectedProductPlans[Audience.B2C] === PLANS.DRIVE && plansMap[PLANS.DRIVE],
        plansMap[PLANS.BUNDLE],
        subscription && hasVisionary(subscription) ? plansMap[PLANS.NEW_VISIONARY] : plansMap[PLANS.FAMILY],
    ].filter(isTruthy);

    const B2BPlans = [
        hasFreePlan ? FREE_PLAN : null,
        selectedProductPlans[Audience.B2B] === PLANS.MAIL_PRO && plansMap[PLANS.MAIL_PRO],
        // selectedPlan === PLANS.DRIVE_PRO && plansMap[PLANS.DRIVE_PRO],
        plansMap[PLANS.BUNDLE_PRO],
        // plansMap[PLANS.ENTERPRISE],
    ].filter(isTruthy);

    const planInfos = getPlansInfo();
    const isSignupMode = mode === 'signup';

    const tabs = [
        {
            title: c('Tab subscription modal').t`For individuals`,
            content: (
                <div
                    className="plan-selection plan-selection--b2c mt1"
                    style={{ '--plan-selection-number': B2CPlans.length }}
                >
                    {B2CPlans.map((plan: Plan) => {
                        const isFree = plan.ID === PLANS.FREE;
                        const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
                        const isRecommended = [PLANS.BUNDLE].includes(plan.Name as PLANS);
                        const canSelect = [PLANS.MAIL, PLANS.VPN, PLANS.DRIVE].includes(plan.Name as PLANS);
                        const selectedPlanLabel = isFree
                            ? c('Action').t`Current plan`
                            : c('Action').t`Edit subscription`;
                        const actionLabel = isCurrentPlan ? selectedPlanLabel : c('Action').t`Select`;

                        return (
                            <PlanCard
                                target={Audience.B2C}
                                isCurrentPlan={!isSignupMode && isCurrentPlan}
                                action={actionLabel}
                                planTitle={PLAN_NAMES[plan.Name as PLANS]}
                                planName={plan.Name as PLANS}
                                canSelect={canSelect}
                                recommended={isRecommended}
                                currency={currency}
                                disabled={loading || (isFree && !isSignupMode && isCurrentPlan)}
                                cycle={cycle}
                                key={plan.ID}
                                price={plan.Pricing[cycle]}
                                info={planInfos[plan.Name as PLANS]}
                                features={
                                    ['signup', 'settings'].includes(mode) ? (
                                        <PlanCardFeatures
                                            planName={plan.Name as PLANS}
                                            vpnCountries={vpnCountries}
                                            vpnServers={vpnServers}
                                        />
                                    ) : null
                                }
                                logos={<PlanCardLogos planName={plan.Name as PLANS} />}
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
                    })}
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
                    {B2BPlans.map((plan: Plan) => {
                        const isFree = plan.ID === PLANS.FREE;
                        const isCurrentPlan = isFree ? !currentPlan : currentPlan?.ID === plan.ID;
                        const isRecommended = [PLANS.BUNDLE_PRO].includes(plan.Name as PLANS);
                        const canSelect = false; // [PLANS.MAIL_PRO, PLANS.DRIVE_PRO].includes(plan.Name as PLANS);
                        const selectedPlanLabel = isFree
                            ? c('Action').t`Current plan`
                            : c('Action').t`Edit subscription`;
                        const actionLabel = isCurrentPlan ? selectedPlanLabel : c('Action').t`Select`;

                        return (
                            <PlanCard
                                target={Audience.B2B}
                                isCurrentPlan={!isSignupMode && isCurrentPlan}
                                action={actionLabel}
                                planTitle={PLAN_NAMES[plan.Name as PLANS]}
                                planName={plan.Name as PLANS}
                                canSelect={canSelect}
                                recommended={isRecommended}
                                currency={currency}
                                disabled={loading || (isFree && !isSignupMode && isCurrentPlan)}
                                cycle={cycle}
                                key={plan.ID}
                                price={plan.Pricing[cycle]}
                                info={planInfos[plan.Name as PLANS]}
                                features={
                                    ['signup', 'settings'].includes(mode) ? (
                                        <PlanCardFeatures
                                            planName={plan.Name as PLANS}
                                            vpnCountries={vpnCountries}
                                            vpnServers={vpnServers}
                                        />
                                    ) : null
                                }
                                logos={<PlanCardLogos planName={plan.Name as PLANS} />}
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
                    })}
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="mb2">
                <div className="text-right plan-selection-currency-selector">
                    <CurrencySelector
                        mode="buttons"
                        currency={currency}
                        onSelect={onChangeCurrency}
                        disabled={loading}
                    />
                </div>
                <Tabs
                    value={audience === Audience.B2C ? 0 : 1}
                    onChange={(newValue) => {
                        onChangeAudience(newValue === 0 ? Audience.B2C : Audience.B2B);
                    }}
                    tabs={tabs}
                    containerClassName="inline-block"
                />
            </div>
            {hasPlanSelectionComparison && (
                <PlanSelectionComparison
                    hasFreePlan={hasFreePlan}
                    selectedPlan={selectedProductPlans[audience]}
                    onChangePlanIDs={onChangePlanIDs}
                    plans={plans}
                    planIDs={planIDs}
                    audience={audience}
                />
            )}
        </>
    );
};

export default PlanSelection;
