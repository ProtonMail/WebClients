import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Button, LinkButton, Icon } from '../../../components';
import { classnames } from '../../../helpers';
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
            <div className="flex-autogrid ontablet-flex-column">
                {plans.map(({ name, title, price, imageSrc, description, features = [], canCustomize }, index) => {
                    return (
                        <div key={title} className="flex-autogrid-item flex" data-plan-name={name}>
                            <div
                                className="bordered-container subscriptionTable-plan onmobile-mb2 pt2 pb2 pl0-75 pr0-75 flex-noMinChildren flex-column relative w100"
                                data-current-plan={index === currentPlanIndex}
                                data-most-popular={index === mostPopularIndex}
                            >
                                <header className="flex flex-column flex-justify-end subscriptionTable-header">
                                    {index === currentPlanIndex ? (
                                        <div className="subscriptionTable-currentPlan-container aligncenter uppercase bold smaller mb0 mt0">
                                            {currentPlan}
                                        </div>
                                    ) : null}
                                    {index === mostPopularIndex ? (
                                        <div className="mb0-5 aligncenter color-global-success bold small mt0 uppercase subscriptionTable-mostPopular">{c(
                                            'Title for subscription plan'
                                        ).t`Most popular`}</div>
                                    ) : null}
                                    <div className="bold aligncenter mb0-5 uppercase">{title}</div>
                                    <div className="aligncenter mb0-5">{price}</div>
                                    <div className="flex flex-items-center flex-justify-center subscriptionTable-image-container">
                                        <img src={imageSrc} alt={title} />
                                    </div>
                                </header>
                                <p className="aligncenter mt0 mb1 bold min-h5e">{description}</p>
                                <ul className="unstyled small mb2 flex-item-fluid-auto">
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
                                <footer className="subscriptionTable-footer aligncenter flex flex-column">
                                    {mode === 'radio' ? (
                                        <Button
                                            disabled={disabled || index === currentPlanIndex}
                                            className={classnames([index !== currentPlanIndex && 'pm-button--primary'])}
                                            onClick={() => onSelect(index)}
                                        >
                                            {index === currentPlanIndex ? selected : select}
                                        </Button>
                                    ) : null}
                                    {mode === 'button' ? (
                                        <Button className="pm-button--primary" onClick={() => onSelect(index)}>
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
