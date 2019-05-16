import React from 'react';
import PropTypes from 'prop-types';

const Wizard = ({ step, steps, hideText }) => {
    return (
        <div className={`wizard-container ${hideText ? 'wizard-container--noTextDisplayed' : ''}`}>
            <ul className="wizard unstyled flex flex-nowrap flex-spacebetween">
                {steps.map((text = '', index) => {
                    return (
                        <li
                            key={index.toString()}
                            className={`wizard-item ${index < step ? 'is-complete' : ''}`}
                            aria-current={index === step ? 'step' : ''}
                        >
                            <span className="wizard-marker" />
                            <span className="wizard-item-inner">{text}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

Wizard.propTypes = {
    // current step
    step: PropTypes.number.isRequired,
    // steps
    steps: PropTypes.arrayOf(PropTypes.string),
    // hide text for steps
    hideText: PropTypes.bool
};

Wizard.defaultProps = {
    hideText: false,
    steps: [],
    step: 0
};

export default Wizard;
