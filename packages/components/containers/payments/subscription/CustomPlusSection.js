import React from 'react';
import PropTypes from 'prop-types';
import { range } from 'proton-shared/lib/helpers/array';
import { ADDON_NAMES, PLANS } from 'proton-shared/lib/constants';

import { Select } from '../../../components';
import PlanPrice from './PlanPrice';
import { getTextOption, getPlan, getAddon } from './helpers';

const CustomPlusSection = ({ plans, model, onChange }) => {
    const plusPlan = getPlan(plans, { name: PLANS.PLUS });
    const spaceAddon = getAddon(plans, { name: ADDON_NAMES.SPACE });
    const addressAddon = getAddon(plans, { name: ADDON_NAMES.ADDRESS });
    const domainAddon = getAddon(plans, { name: ADDON_NAMES.DOMAIN });
    const spaceOptions = range(5, 21).map((value, index) => ({
        text: getTextOption('space', value, index),
        value: index,
    }));
    const addressOptions = range(5, 51, 5).map((value, index) => ({
        text: getTextOption('address', value, index),
        value: index,
    }));
    const domainOptions = range(1, 11).map((value, index) => ({
        text: getTextOption('domain', value, index),
        value: index,
    }));

    const handleChange = (key) => ({ target }) => {
        onChange({ ...model, plansMap: { ...model.plansMap, [key]: +target.value } });
    };

    return (
        <>
            <div className="flex flex-justify-space-between pb1 mb1 border-bottom">
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
            <div className="flex flex-justify-space-between pb1 mb1 border-bottom">
                <div>
                    <Select
                        options={spaceOptions}
                        value={model.plansMap[ADDON_NAMES.SPACE]}
                        onChange={handleChange(ADDON_NAMES.SPACE)}
                    />
                </div>
                <div>
                    {model.plansMap[ADDON_NAMES.SPACE] ? (
                        <PlanPrice
                            quantity={model.plansMap[ADDON_NAMES.SPACE]}
                            currency={model.currency}
                            amount={spaceAddon.Pricing[model.cycle]}
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
                        options={addressOptions}
                        value={model.plansMap[ADDON_NAMES.ADDRESS]}
                        onChange={handleChange(ADDON_NAMES.ADDRESS)}
                    />
                </div>
                <div>
                    {model.plansMap[ADDON_NAMES.ADDRESS] ? (
                        <PlanPrice
                            quantity={model.plansMap[ADDON_NAMES.ADDRESS]}
                            currency={model.currency}
                            amount={addressAddon.Pricing[model.cycle]}
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

CustomPlusSection.propTypes = {
    plans: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default CustomPlusSection;
