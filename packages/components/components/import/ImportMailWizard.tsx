import React from 'react';
import { classnames } from '../../helpers/component';

import './ImportMailWizard.scss';

interface Props {
    step: number;
    steps: string[];
}

const ImportMailWizard = ({ step = 0, steps = [] }: Props) => {
    return (
        <div className="wizard-container import-mail-wizard-container">
            <ul className="wizard import-mail-wizard unstyled flex flex-nowrap flex-justify-space-between">
                {steps.map((text = '', index) => {
                    return (
                        <li
                            key={`wizard-dot-${text.split(' ').join('-')}`}
                            className={classnames(['wizard-item', index < step && 'is-complete'])}
                            aria-current={index === step ? 'step' : undefined}
                        >
                            <span className="wizard-marker" />
                        </li>
                    );
                })}
            </ul>
            <ul className="unstyled flex flex-nowrap m0">
                {steps.map((text = '', index) => {
                    return (
                        <li
                            key={`wizard-label-${index.toString()}`}
                            className={classnames(['wizard-label', index < step && 'is-complete'])}
                            aria-current={index === step ? 'step' : undefined}
                        >
                            <span>{text}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ImportMailWizard;
