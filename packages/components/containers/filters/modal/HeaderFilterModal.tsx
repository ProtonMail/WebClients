import React from 'react';
import { c } from 'ttag';

import { SimpleFilterModalModel, Step, Errors } from '../interfaces';

interface Props {
    model: SimpleFilterModalModel;
    onChange: (newModel: SimpleFilterModalModel) => void;
    errors: Errors;
}

const HeaderFilterModal = ({ model, errors, onChange }: Props) => {
    return (
        <header>
            <ul className="breadcrumb-container unstyled inline-flex pl0-5 pr0-5 mt0">
                <li className="breadcrumb-item">
                    <button
                        type="button"
                        disabled={model.step === Step.NAME}
                        aria-current={model.step === Step.NAME ? 'step' : false}
                        onClick={() => onChange({ ...model, step: Step.NAME })}
                        className="breadcrumb-button"
                    >
                        {c('Step in filter modal').t`Name`}
                    </button>
                </li>
                <li className="breadcrumb-item">
                    <button
                        type="button"
                        disabled={model.step === Step.CONDITIONS || !!errors.name}
                        aria-current={model.step === Step.CONDITIONS ? 'step' : false}
                        onClick={() => onChange({ ...model, step: Step.CONDITIONS })}
                        className="breadcrumb-button"
                    >
                        {c('Step in filter modal').t`Conditions`}
                    </button>
                </li>
                <li className="breadcrumb-item">
                    <button
                        type="button"
                        disabled={model.step === Step.ACTIONS || !!errors.name || !!errors.conditions}
                        aria-current={model.step === Step.ACTIONS ? 'step' : false}
                        onClick={() => onChange({ ...model, step: Step.ACTIONS })}
                        className="breadcrumb-button"
                    >
                        {c('Step in filter modal').t`Actions`}
                    </button>
                </li>
                <li className="breadcrumb-item">
                    <button
                        type="button"
                        disabled={
                            model.step === Step.PREVIEW || !!errors.name || !!errors.actions || !!errors.conditions
                        }
                        aria-current={model.step === Step.PREVIEW ? 'step' : false}
                        onClick={() => onChange({ ...model, step: Step.PREVIEW })}
                        className="breadcrumb-button"
                    >
                        {c('Step in filter modal').t`Preview`}
                    </button>
                </li>
            </ul>
        </header>
    );
};

export default HeaderFilterModal;
