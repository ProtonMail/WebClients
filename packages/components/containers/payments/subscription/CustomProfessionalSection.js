import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { range } from 'proton-shared/lib/helpers/array';
import { ADDON_NAMES, PLANS } from 'proton-shared/lib/constants';

import { Select } from '../../../components';
import PlanPrice from './PlanPrice';
import { getTextOption, getPlan, getAddon } from './helpers';

const CustomProfessionalSection = ({ plans, model, onChange }) => {
    const professionalPlan = getPlan(plans, { name: PLANS.PROFESSIONAL });
    const memberAddon = getAddon(plans, { name: ADDON_NAMES.MEMBER });
    const domainAddon = getAddon(plans, { name: ADDON_NAMES.DOMAIN });
    const memberOptions = range(1, 5001).map((value, index) => ({
        text: getTextOption('member', value, index),
        value: index,
    }));
    const domainOptions = range(2, 101).map((value, index) => ({
        text: getTextOption('domain', value, index),
        value: index,
    }));

    const handleChange = (key) => ({ target }) => {
        onChange({ ...model, plansMap: { ...model.plansMap, [key]: +target.value } });
    };

    return (
        <>
            <div className="flex flex-justify-space-between pb1 mb1 border-bottom">
                <div>ProtonMail Professional</div>
                <div>
                    <PlanPrice
                        quantity={model.plansMap.professional}
                        currency={model.currency}
                        amount={professionalPlan.Pricing[model.cycle]}
                        cycle={model.cycle}
                    />
                </div>
            </div>
            <div className="flex flex-justify-space-between pb1 mb1 border-bottom">
                <div>
                    <Select
                        title={c('Tooltip')
                            .t`For each additional user, 5GB of storage and 5 email addresses are added to your subscription.`}
                        options={memberOptions}
                        value={model.plansMap[ADDON_NAMES.MEMBER]}
                        onChange={handleChange(ADDON_NAMES.MEMBER)}
                    />
                </div>
                <div>
                    {model.plansMap[ADDON_NAMES.MEMBER] ? (
                        <PlanPrice
                            quantity={model.plansMap[ADDON_NAMES.MEMBER]}
                            currency={model.currency}
                            amount={memberAddon.Pricing[model.cycle]}
                            cycle={model.cycle}
                        />
                    ) : (
                        '-'
                    )}
                </div>
            </div>
            <div className="flex flex-justify-space-between pb1 mb1 border-bottom">
                <div>
                    <Select
                        title={c('Tooltip')
                            .t`Allows you to host emails for your own domain(s) at ProtonMail, e.g. thomas.anderson@example.com`}
                        options={domainOptions}
                        value={model.plansMap[ADDON_NAMES.DOMAIN]}
                        onChange={handleChange(ADDON_NAMES.DOMAIN)}
                    />
                </div>
                <div>
                    {model.plansMap[ADDON_NAMES.DOMAIN] ? (
                        <PlanPrice
                            quantity={model.plansMap[ADDON_NAMES.DOMAIN]}
                            currency={model.currency}
                            amount={domainAddon.Pricing[model.cycle]}
                            cycle={model.cycle}
                        />
                    ) : (
                        '-'
                    )}
                </div>
            </div>
        </>
    );
};

CustomProfessionalSection.propTypes = {
    plans: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default CustomProfessionalSection;
