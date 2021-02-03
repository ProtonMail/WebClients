import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers';

const Wizard = ({ step = 0, steps = [], hideText = false }) => {
    return (
        <div className={classnames(['wizard-container', hideText && 'wizard-container--no-text-displayed'])}>
            <ul className="wizard unstyled flex flex-nowrap flex-justify-space-between">
                {steps.map((text = '', index) => {
                    return (
                        <li
                            key={index.toString()}
                            className={classnames(['wizard-item', index < step && 'is-complete'])}
                            aria-current={index === step ? 'step' : null}
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
    hideText: PropTypes.bool,
};

export default Wizard;
