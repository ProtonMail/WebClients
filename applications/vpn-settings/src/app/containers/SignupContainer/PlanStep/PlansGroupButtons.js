import React from 'react';
import PropTypes from 'prop-types';
import { Group, ButtonGroup, classnames } from 'react-components';
import { CURRENCIES, CYCLE } from 'proton-shared/lib/constants';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const PlansGroupButtons = ({ plans, onSelectPlan, model, ...rest }) => {
    return (
        <Group {...rest} className="w100">
            {plans.map(({ planName, title }) => {
                return (
                    <ButtonGroup
                        key={planName}
                        className={classnames(['flex-item-fluid', planName === model.planName && 'is-active'])}
                        onClick={() => onSelectPlan({ ...model, planName })}
                    >
                        {title}
                    </ButtonGroup>
                );
            })}
        </Group>
    );
};

PlansGroupButtons.propTypes = {
    plans: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSelectPlan: PropTypes.func.isRequired,
    model: PropTypes.shape({
        planName: PropTypes.string.isRequired,
        cycle: PropTypes.oneOf([MONTHLY, TWO_YEARS, YEARLY]).isRequired,
        currency: PropTypes.oneOf(CURRENCIES).isRequired
    }).isRequired
};

export default PlansGroupButtons;
