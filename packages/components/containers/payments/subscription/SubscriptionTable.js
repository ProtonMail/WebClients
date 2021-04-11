import React from 'react';
import PropTypes from 'prop-types';
import './SubscriptionTable.scss';
import SubscriptionOption from './SubscriptionOption';

const SubscriptionTable = ({ plans, onSelect }) => {
    return (
        <div className="mt2 subscriptionTable">
            <div className="flex-autogrid flex-nowrap on-tablet-flex-column">
                {plans.map((plan, index) => (
                    <SubscriptionOption key={plan.name} onSelect={() => onSelect(index)} {...plan} />
                ))}
            </div>
        </div>
    );
};

SubscriptionTable.propTypes = {
    disabled: PropTypes.bool,
    currentPlan: PropTypes.string,
    plans: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            price: PropTypes.node.isRequired,
            imageSrc: PropTypes.string.isRequired,
            description: PropTypes.node.isRequired,
            features: PropTypes.arrayOf(
                PropTypes.shape({
                    icon: PropTypes.string.isRequired,
                    content: PropTypes.node.isRequired,
                })
            ).isRequired,
        })
    ),
    onSelect: PropTypes.func.isRequired,
    currentPlanIndex: PropTypes.number,
    mostPopularIndex: PropTypes.number,
    selected: PropTypes.string,
    select: PropTypes.string,
    mode: PropTypes.oneOf(['radio', 'button']),
};

export default SubscriptionTable;
