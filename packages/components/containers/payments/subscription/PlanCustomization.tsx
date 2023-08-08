import { PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { Currency, Cycle, Organization, PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';

import ProtonPlanCustomizer, { CustomiserMode } from '../ProtonPlanCustomizer';

interface Props {
    loading: boolean;
    cycle: Cycle;
    currency: Currency;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    mode?: CustomiserMode;
    organization?: Organization;
    forceHideDescriptions?: boolean;
    showUsersTooltip?: boolean;
}

const PlanCustomization = ({
    mode,
    plansMap,
    planIDs,
    cycle,
    currency,
    onChangePlanIDs,
    loading,
    organization,
    forceHideDescriptions,
    ...rest
}: Props) => {
    const [currentPlanName] =
        Object.entries(planIDs).find(([planName, planQuantity]) => {
            if (planQuantity) {
                const plan = plansMap[planName as keyof PlansMap];
                return plan?.Type === PLAN_TYPES.PLAN;
            }
            return false;
        }) || [];
    const currentPlan = plansMap?.[currentPlanName as keyof PlansMap];
    const hasPlanCustomiser =
        currentPlan &&
        [
            PLANS.MAIL_PRO,
            PLANS.DRIVE_PRO,
            PLANS.BUNDLE_PRO,
            PLANS.ENTERPRISE,
            PLANS.VPN_PRO,
            PLANS.VPN_BUSINESS,
        ].includes(currentPlan.Name as PLANS);

    return (
        <>
            {currentPlan && hasPlanCustomiser && (
                <ProtonPlanCustomizer
                    mode={mode}
                    loading={loading}
                    cycle={cycle}
                    currency={currency}
                    planIDs={planIDs}
                    plansMap={plansMap}
                    currentPlan={currentPlan}
                    organization={organization}
                    onChangePlanIDs={onChangePlanIDs}
                    forceHideDescriptions={forceHideDescriptions}
                    className="pb-7 mb-8"
                    {...rest}
                />
            )}
        </>
    );
};

export default PlanCustomization;
