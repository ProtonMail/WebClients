import React from 'react';
import PropTypes from 'prop-types';
import { PLAN_SERVICES } from 'proton-shared/lib/constants';

import { getSubTotal } from './helpers';
import CyclePromotion from './CyclePromotion';
import CustomPlusSection from './CustomPlusSection';
import CustomProfessionalSection from './CustomProfessionalSection';
import PlanPrice from './PlanPrice';
import CycleDiscountBadge from '../CycleDiscountBadge';
import { c } from 'ttag';

const { MAIL } = PLAN_SERVICES;

const CustomMailSection = ({ plans, model, onChange }) => {
    const subTotal = getSubTotal({ ...model, plans, services: MAIL });
    return (
        <>
            <CyclePromotion model={model} onChange={onChange} />
            {model.plansMap.plus ? <CustomPlusSection plans={plans} model={model} onChange={onChange} /> : null}
            {model.plansMap.professional ? (
                <CustomProfessionalSection plans={plans} model={model} onChange={onChange} />
            ) : null}
            <div className="flex flex-spacebetween pt1 mb1">
                <div>
                    <strong>{c('Title').t`ProtonMail total`}</strong> <CycleDiscountBadge cycle={model.cycle} />
                </div>
                <div className="bold">
                    {subTotal ? (
                        <PlanPrice amount={subTotal} cycle={model.cycle} currency={model.currency} />
                    ) : (
                        c('Price').t`Free`
                    )}
                </div>
            </div>
        </>
    );
};

CustomMailSection.propTypes = {
    plans: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default CustomMailSection;
