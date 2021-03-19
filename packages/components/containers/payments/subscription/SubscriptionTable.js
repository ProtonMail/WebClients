import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Button, LinkButton, Icon } from '../../../components';
import './SubscriptionTable.scss';

const SubscriptionTable = ({
    plans,
    onSelect,
    currentPlanIndex = 0,
    mostPopularIndex = 0,
    currentPlan = c('Title for subscription plan').t`Current plan`,
    selected = c('Info').t`Selected`,
    select = c('Action').t`Select`,
    disabled = false,
    mode = 'radio',
}) => {
    return (
        <div className="mt2 subscriptionTable">
            <div className="flex-autogrid on-tablet-flex-column">
                {plans.map(({ name, title, price, imageSrc, description, features = [], canCustomize }, index) => {
                    return (
                        <div key={title} className="flex-autogrid-item flex" data-plan-name={name}>
                            <div
                                className="bordered subscriptionTable-plan on-mobile-mb2 pt2 pb2 pl0-75 pr0-75 flex-no-min-children flex-column relative w100"
                                data-current-plan={index === currentPlanIndex}
                                data-most-popular={index === mostPopularIndex}
                            >
                                <header className="flex flex-column flex-justify-end subscriptionTable-header">
                                    {index === currentPlanIndex ? (
                                        <div className="subscriptionTable-currentPlan-container text-center text-uppercase text-bold text-xs mb0 mt0">
                                            {currentPlan}
                                        </div>
                                    ) : null}
                                    {index === mostPopularIndex ? (
                                        <div className="mb0-5 text-center color-success text-bold text-sm mt0 text-uppercase subscriptionTable-mostPopular">{c(
                                            'Title for subscription plan'
                                        ).t`Most popular`}</div>
                                    ) : null}
                                    <div className="text-bold text-center mb0-5 text-uppercase">{title}</div>
                                    <div className="text-center mb0-5">{price}</div>
                                    <div className="flex flex-align-items-center flex-justify-center subscriptionTable-image-container">
                                        <img src={imageSrc} alt={title} />
                                    </div>
                                </header>
                                <p className="text-center mt0 mb1 text-bold min-h5e">{description}</p>
                                <ul className="unstyled text-sm mb2 flex-item-fluid-auto">
                                    {features.map(({ icon, content }, index) => {
                                        return (
                                            <li className="subscriptionTable-feature flex flex-nowrap" key={index}>
                                                <Icon
                                                    name={icon}
                                                    size="12"
                                                    className="mt0-4 mr0-5 flex-item-noshrink on-rtl-mirror"
                                                />
                                                {content}
                                            </li>
                                        );
                                    })}
                                </ul>
                                <footer className="subscriptionTable-footer text-center flex flex-column">
                                    {mode === 'radio' ? (
                                        <Button
                                            disabled={disabled || index === currentPlanIndex}
                                            color={index !== currentPlanIndex && 'norm'}
                                            onClick={() => onSelect(index)}
                                        >
                                            {index === currentPlanIndex ? selected : select}
                                        </Button>
                                    ) : null}
                                    {mode === 'button' ? (
                                        <Button color="norm" onClick={() => onSelect(index)}>
                                            {select}
                                        </Button>
                                    ) : null}
                                    {canCustomize ? (
                                        <LinkButton
                                            disabled={disabled}
                                            className="subscriptionTable-customize-button"
                                            onClick={() => onSelect(index, true)}
                                        >{c('Action').t`Customize`}</LinkButton>
                                    ) : null}
                                </footer>
                            </div>
                        </div>
                    );
                })}
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
