import React from 'react';
import { PLAN_SERVICES, PLAN_TYPES, PLANS } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { Currency, Cycle, Organization, Plan, PlanIDs, Subscription } from 'proton-shared/lib/interfaces';

import ProtonPlanPicker from '../ProtonPlanPicker';
import ProtonPlanCustomizer from '../ProtonPlanCustomizer';

interface Props {
    onBack?: (service: PLAN_SERVICES) => void;
    loading: boolean;
    hasMailPlanPicker?: boolean;
    cycle: Cycle;
    currency: Currency;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    onChangeCycle: (cycle: Cycle) => void;
    planIDs: PlanIDs;
    plans: Plan[];
    organization?: Organization;
    service: PLAN_SERVICES;
    subscription?: Subscription;
}

const PlanCustomization = ({
    plans,
    planIDs,
    cycle,
    currency,
    service,
    hasMailPlanPicker = true,
    onChangePlanIDs,
    onChangeCycle,
    onBack,
    loading,
    organization,
    subscription,
}: Props) => {
    const services =
        service === PLAN_SERVICES.MAIL
            ? [PLAN_SERVICES.MAIL, PLAN_SERVICES.VPN]
            : [PLAN_SERVICES.VPN, PLAN_SERVICES.MAIL];

    const plansMap = toMap(plans, 'ID');
    const plansNameMap = toMap(plans, 'Name');

    return (
        <>
            {services.map((service, index) => {
                const [currentPlanID] =
                    Object.entries(planIDs).find(([planID, planQuantity]) => {
                        if (planQuantity) {
                            const { Services, Type } = plansMap[planID];
                            return hasBit(Services, service) && Type === PLAN_TYPES.PLAN;
                        }
                        return false;
                    }) || [];
                const currentPlan = currentPlanID ? plansMap[currentPlanID] : undefined;

                const hasPlanCustomiser =
                    currentPlan && ![PLANS.VPNBASIC, PLANS.VISIONARY].includes(currentPlan.Name as PLANS);

                return (
                    <React.Fragment key={service}>
                        {service === PLAN_SERVICES.MAIL && !hasMailPlanPicker ? null : (
                            <ProtonPlanPicker
                                index={index}
                                subscription={subscription}
                                organization={organization}
                                plans={plans}
                                plansMap={plansMap}
                                plansNameMap={plansNameMap}
                                service={service}
                                planIDs={planIDs}
                                cycle={cycle}
                                currency={currency}
                                onChangeCycle={onChangeCycle}
                                onChangePlanIDs={onChangePlanIDs}
                                onBack={onBack ? () => onBack(service) : undefined}
                                className="pb2 mb2"
                            />
                        )}
                        {currentPlan && hasPlanCustomiser && (
                            <ProtonPlanCustomizer
                                loading={loading}
                                cycle={cycle}
                                currency={currency}
                                plans={plans}
                                planIDs={planIDs}
                                plansMap={plansMap}
                                plansNameMap={plansNameMap}
                                currentPlan={currentPlan}
                                service={service}
                                organization={organization}
                                onChangePlanIDs={onChangePlanIDs}
                                className="pb2 mb2"
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default PlanCustomization;
