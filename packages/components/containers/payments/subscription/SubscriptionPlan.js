import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { CURRENCIES, CYCLE } from 'proton-shared/lib/constants';
import { useToggle } from '../../../hooks';
import { LinkButton, Price, Icon } from '../../../components';

const SubscriptionPlan = ({
    canCustomize = false,
    expanded = false,
    features = [],
    addons = [],
    description,
    plan,
    currency,
}) => {
    const { state, toggle } = useToggle(expanded);

    return (
        <>
            <div className="flex flex-wrap on-mobile-flex-column">
                <div className="bordered p1 mr1 mb1">
                    <div className="text-bold mb1">{c('Title').t`Plan summary`}</div>
                    <ul className="unstyled mb1">
                        {features.map((feature, index) => {
                            return (
                                <li className="mb0-25" key={index}>
                                    {feature}
                                </li>
                            );
                        })}
                    </ul>
                </div>
                {canCustomize && state ? (
                    <div className="bordered p1 mb1 subscriptionPlan-customize">
                        <div className="flex flex-nowrap flex-align-items-center flex-justify-space-between mb1">
                            <div className="text-bold">{c('Title').t`Configure plan`}</div>
                            <Price className="text-lg mt0 mb0" currency={currency} suffix={c('Suffix').t`/month`}>
                                {plan.Pricing[CYCLE.MONTHLY]}
                            </Price>
                        </div>
                        <div className="flex flex-column">
                            <div className="flex-item-fluid-auto">{addons.map((addon) => addon)}</div>
                            {description ? <div>{description}</div> : null}
                        </div>
                    </div>
                ) : null}
            </div>
            {canCustomize ? (
                <div className="mb1">
                    <LinkButton className="flex flex-nowrap no-outline flex-align-items-center" onClick={toggle}>
                        <Icon name="caret" className={state ? 'rotateZ-90' : 'rotateZ-270'} />
                        <span>
                            {state
                                ? c('Action').t`Hide customization options`
                                : c('Action').t`Show customization options`}
                        </span>
                    </LinkButton>
                </div>
            ) : null}
        </>
    );
};

SubscriptionPlan.propTypes = {
    canCustomize: PropTypes.bool,
    expanded: PropTypes.bool,
    features: PropTypes.arrayOf(PropTypes.node),
    addons: PropTypes.arrayOf(PropTypes.node),
    currency: PropTypes.oneOf(CURRENCIES),
    plan: PropTypes.object.isRequired,
    description: PropTypes.string,
};

export default SubscriptionPlan;
