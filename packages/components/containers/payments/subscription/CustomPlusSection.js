import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Select, Info } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

import PlanPrice from './PlanPrice';
import { getTextOption, getPlan, getAddon } from './helpers';

const CustomPlusSection = ({ plans, model, onChange }) => {
    const plusPlan = getPlan(plans, { name: 'plus' });
    const spaceAddon = getAddon(plans, { name: '1gb' });
    const addressAddon = getAddon(plans, { name: '5address' });
    const domainAddon = getAddon(plans, { name: '1domain' });
    const spaceOptions = range(5, 21).map((value, index) => ({
        text: getTextOption('space', value, index),
        value: index
    }));
    const addressOptions = range(5, 51, 5).map((value, index) => ({
        text: getTextOption('address', value, index),
        value: index
    }));
    const domainOptions = range(1, 11).map((value, index) => ({
        text: getTextOption('domain', value, index),
        value: index
    }));

    const handleChange = (key) => ({ target }) => {
        onChange({ ...model, plansMap: { ...model.plansMap, [key]: +target.value } });
    };

    return (
        <>
            <div className="flex flex-spacebetween pb1 mb1 border-bottom">
                <div>ProtonMail Plus</div>
                <div>
                    <PlanPrice
                        quantity={model.plansMap.plus}
                        currency={model.currency}
                        amount={plusPlan.Pricing[model.cycle]}
                        cycle={model.cycle}
                    />
                </div>
            </div>
            <div className="flex flex-spacebetween pb1 mb1 border-bottom">
                <div>
                    <Select options={spaceOptions} value={model.plansMap['1gb']} onChange={handleChange('1gb')} />
                </div>
                <div>
                    {model.plansMap['1gb'] ? (
                        <PlanPrice
                            quantity={model.plansMap['1gb']}
                            currency={model.currency}
                            amount={spaceAddon.Pricing[model.cycle]}
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
                        options={addressOptions}
                        value={model.plansMap['5address']}
                        onChange={handleChange('5address')}
                    />
                    <Info title={c('Tooltip').t`Add additional addresses to your account.`} />
                </div>
                <div>
                    {model.plansMap['5address'] ? (
                        <PlanPrice
                            quantity={model.plansMap['5address']}
                            currency={model.currency}
                            amount={addressAddon.Pricing[model.cycle]}
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
                    <Info title={c('Tooltip').t`Use your own domain name.`} />
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

CustomPlusSection.propTypes = {
    plans: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default CustomPlusSection;
