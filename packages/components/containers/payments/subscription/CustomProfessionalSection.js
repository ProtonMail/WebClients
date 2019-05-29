import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Select, Info } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

import PlanPrice from './PlanPrice';
import { getTextOption, getPlan, getAddon } from './helpers';

const CustomProfessionalSection = ({ plans, model, onChange }) => {
    const professionalPlan = getPlan(plans, { name: 'professional' });
    const memberAddon = getAddon(plans, { name: '1member' });
    const domainAddon = getAddon(plans, { name: '1domain' });
    const memberOptions = range(1, 5001).map((value, index) => ({
        text: getTextOption('member', value, index),
        value: index
    }));
    const domainOptions = range(2, 101).map((value, index) => ({
        text: getTextOption('domain', value, index),
        value: index
    }));

    const handleChange = (key) => ({ target }) => {
        onChange({ ...model, plansMap: { ...model.plansMap, [key]: +target.value } });
    };

    return (
        <>
            <div className="flex flex-spacebetween pb1 mb1 border-bottom">
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
            <div className="flex flex-spacebetween pb1 mb1 border-bottom">
                <div>
                    <Select
                        options={memberOptions}
                        value={model.plansMap['1member']}
                        onChange={handleChange('1member')}
                    />
                    <Info
                        title={c('Tooltip')
                            .t`For each additional user, 5GB of storage and 5 email addresses are added to your subscription.`}
                    />
                </div>
                <div>
                    {model.plansMap['1member'] ? (
                        <PlanPrice
                            quantity={model.plansMap['1member']}
                            currency={model.currency}
                            amount={memberAddon.Pricing[model.cycle]}
                            cycle={model.cycle}
                        />
                    ) : (
                        '-'
                    )}
                </div>
            </div>
            <div className="flex flex-spacebetween pb1 mb1 border-bottom">
                <div>
                    <Select
                        options={domainOptions}
                        value={model.plansMap['1domain']}
                        onChange={handleChange('1domain')}
                    />
                    <Info
                        title={c('Tooltip')
                            .t`Allows you to host emails for your own domain(s) at ProtonMail, e.g. thomas.anderson@example.com`}
                    />
                </div>
                <div>
                    {model.plansMap['1domain'] ? (
                        <PlanPrice
                            quantity={model.plansMap['1domain']}
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
    onChange: PropTypes.func.isRequired
};

export default CustomProfessionalSection;
