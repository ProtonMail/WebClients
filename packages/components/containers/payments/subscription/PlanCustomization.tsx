import React from 'react';
import { PLAN_SERVICES } from 'proton-shared/lib/constants';

import ProtonPlanPicker, { Props as ProtonPlanPickerProps } from '../ProtonPlanPicker';
import ProtonPlanCustomizer from '../ProtonPlanCustomizer';

interface Props extends Omit<ProtonPlanPickerProps, 'onBack'> {
    onBack: (service: PLAN_SERVICES) => void;
    loading: boolean;
}

const PlanCustomization = ({
    plans,
    planIDs,
    cycle,
    currency,
    service,
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

    return (
        <>
            {services.map((service, index) => {
                return (
                    <React.Fragment key={service}>
                        <ProtonPlanPicker
                            index={index}
                            subscription={subscription}
                            organization={organization}
                            plans={plans}
                            service={service}
                            planIDs={planIDs}
                            cycle={cycle}
                            currency={currency}
                            onChangeCycle={onChangeCycle}
                            onChangePlanIDs={onChangePlanIDs}
                            onBack={() => onBack(service)}
                        />
                        <ProtonPlanCustomizer
                            loading={loading}
                            cycle={cycle}
                            currency={currency}
                            plans={plans}
                            planIDs={planIDs}
                            service={service}
                            organization={organization}
                            onChangePlanIDs={onChangePlanIDs}
                        />
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default PlanCustomization;
