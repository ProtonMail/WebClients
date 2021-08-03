import PropTypes from 'prop-types';
import { classnames, Button, Tooltip, Badge } from '@proton/components';
import { c } from 'ttag';
import { CYCLE, CURRENCIES } from '@proton/shared/lib/constants';
import PlanPrice from './PlanPrice';

import './PlanCard.scss';

const PlanCard = ({ plan, isActive, onSelect, cycle, currency, isDisabled }) => {
    const button = (
        <Button
            disabled={isDisabled}
            onClick={onSelect}
            color={isActive ? 'norm' : undefined}
            shape={!isActive ? 'outline' : undefined}
            className={classnames(['w100 mtauto'])}
        >
            {c('Plan Action').t`Get ${plan.title}`}
        </Button>
    );

    return (
        <div
            className={classnames([
                'plan-card flex-item-fluid flex flex-column relative',
                isActive ? 'plan-card--active' : 'no-mobile',
            ])}
        >
            <div className="mb1 plan-card-image flex flex-align-items-end no-mobile">{plan.image}</div>
            <div className="flex flex-align-items-center relative">
                <strong className="text-2xl mt0 mb0">{plan.title}</strong>
                {plan.isBest && (
                    <div className="mlauto plan-card-mostPopular">
                        <Badge>{c('Plan info').t`Most popular`}</Badge>
                    </div>
                )}
            </div>
            <div className="flex-item-fluid-auto pt1 pb1 flex-no-min-children flex-column">
                <PlanPrice plan={plan} cycle={cycle} currency={currency} />
                {plan.description && (
                    <strong
                        className={classnames([
                            'min-h5e border-top mt1 pt1 mb1 text-lg text-break',
                            isActive && 'color-primary',
                        ])}
                    >
                        {plan.description}
                    </strong>
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
        features: PropTypes.arrayOf(PropTypes.node),
        highlights: PropTypes.arrayOf(PropTypes.string),
        isBest: PropTypes.bool,
    }).isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
    onSelect: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
};

export default PlanCard;
