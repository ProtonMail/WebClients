import React from 'react';
import PropTypes from 'prop-types';
import { classnames, Button, Tooltip, Badge } from 'react-components';
import { c } from 'ttag';
import PlanPrice from './PlanPrice';
import { CYCLE, CURRENCIES } from 'proton-shared/lib/constants';

const PlanCard = ({ plan, isActive, onSelect, cycle, currency, isDisabled }) => {
    const button = (
        <Button
            disabled={isDisabled}
            onClick={onSelect}
            className={classnames([
                'w100 mtauto',
                !isActive && 'pm-button--primaryborder',
                isActive && 'pm-button--primary'
            ])}
        >
            {c('Plan Action').t`Get ${plan.title}`}
        </Button>
    );

    return (
        <div
            className={classnames([
                'plan-card flex-item-fluid flex flex-column relative',
                isActive ? 'plan-card--active' : 'nomobile'
            ])}
        >
            <div className="mb1 plan-card-image flex flex-items-end nomobile">{plan.image}</div>
            <div className="flex flex-items-center relative">
                <strong className="biggest mt0 mb0">{plan.title}</strong>
                {plan.isBest && (
                    <div className="mlauto plan-card-mostPopular">
                        <Badge>{c('Plan info').t`Most popular`}</Badge>
                    </div>
                )}
            </div>
            <div className="flex-item-fluid-auto pt1 pb1 flex flex-column">
                <PlanPrice plan={plan} cycle={cycle} currency={currency} />
                {plan.description && (
                    <strong className={classnames(['border-top mt1 pt1 mb1 big', isActive && 'color-primary'])}>
                        {plan.description}
                    </strong>
                )}
                {plan.additionalFeatures && (
                    <>
                        <div>{plan.additionalFeatures}</div>
                        <strong className="color-primary">+</strong>
                    </>
                )}
                {plan.features && (
                    <ul className="mt0 mb2 unstyled">
                        {plan.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                        ))}
                    </ul>
                )}
                {isDisabled ? (
                    <Tooltip title={c('Info').t`This plan is temporarily disabled`}>{button}</Tooltip>
                ) : (
                    button
                )}
            </div>
        </div>
    );
};

PlanCard.propTypes = {
    isActive: PropTypes.bool.isRequired,
    plan: PropTypes.shape({
        image: PropTypes.node.isRequired,
        planName: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        additionalFeatures: PropTypes.string,
        features: PropTypes.arrayOf(PropTypes.node),
        highlights: PropTypes.arrayOf(PropTypes.string),
        isBest: PropTypes.bool
    }).isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
    onSelect: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool
};

export default PlanCard;
