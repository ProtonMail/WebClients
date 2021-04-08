import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, Price, Icon } from 'react-components';
import { CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { PLAN } from '../plans';

const PlanUpsell = ({ selectedPlan, getPlanByName, cycle, currency, onExtendCycle, onUpgrade }) => {
    const { planName, upsell } = selectedPlan;
    const upsellCycle = cycle === CYCLE.MONTHLY && planName !== PLAN.FREE;

    if (!upsell && !upsellCycle) {
        return null; // No upsell needed
    }

    const yearlyPlan = getPlanByName(selectedPlan.planName, CYCLE.YEARLY);
    const upsellPlan = upsell && getPlanByName(upsell.planName);

    const handleExtendCycle = () => onExtendCycle();
    const handleUpgrade = () => onUpgrade(upsell.planName);

    const totalMonthlyText = upsellPlan && (
        <Price key="upgrade-price" currency={currency} suffix={c('Suffix').t`/ month`}>
            {upsellPlan.price.totalMonthly}
        </Price>
    );

    return (
        <div className="flex mt1 flex-column bordered">
            <h6 className="p0-5 mb0 w100 text-center color-primary">
                {[PLAN.FREE, PLAN.BASIC].includes(planName)
                    ? c('Title').t`Upgrade and get more`
                    : c('Title').t`Summary`}
            </h6>
            <div className="p1">
                {upsellCycle && (
                    <>
                        <div className="flex flex-justify-space-between">
                            <span className="mr0-25">{c('Plan upsell').t`Monthly plan`}</span>
                            <s>
                                <Price className="text-strike" currency={currency} suffix={c('Suffix').t`/ month`}>
                                    {selectedPlan.price.totalMonthly}
                                </Price>
                            </s>
                        </div>
                        <div className="flex flex-justify-space-between">
                            <span className="mr0-25">{c('Plan upsell').t`Yearly plan`}</span>
                            <Price currency={currency} suffix={c('Suffix').t`/ month`}>
                                {yearlyPlan.price.totalMonthly}
                            </Price>
                        </div>
                        <PrimaryButton className="w100 mt1" onClick={handleExtendCycle}>{c('Action')
                            .t`Pay annually and save 20%`}</PrimaryButton>
                    </>
                )}

                {upsell && !upsellCycle && (
                    <>
                        <ul className="selected-plan-list unstyled m0">
                            {upsell.features.map((feature, i) => (
                                <li key={i} className="flex flex-nowrap">
                                    <Icon name="on" className="color-primary mt0-25 mr1 flex-item-noshrink" />
                                    <span className="flex-item-fluid">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <PrimaryButton className="w100 mt1" onClick={handleUpgrade}>{c('Action')
                            .jt`Try ${upsellPlan.title} for only ${totalMonthlyText}`}</PrimaryButton>
                    </>
                )}
            </div>
        </div>
    );
};

PlanUpsell.propTypes = {
    selectedPlan: PropTypes.object.isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
    onExtendCycle: PropTypes.func.isRequired,
    onUpgrade: PropTypes.func.isRequired,
    getPlanByName: PropTypes.func.isRequired,
};

export default PlanUpsell;
