import React from 'react';
import { c } from 'ttag';

import { AdvancedSimpleFilterModalModel, StepSieve, ErrorsSieve } from './interfaces';

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
    errors: ErrorsSieve;
}

const HeaderAdvancedFilterModal = ({ model, errors, onChange }: Props) => {
    return (
        <header>
            <ul className="breadcrumb-container unstyled inline-flex pl0-5 pr0-5 mt0">
                <li className="breadcrumb-item">
                    <button
                        type="button"
                        disabled={model.step === StepSieve.NAME}
                        aria-current={model.step === StepSieve.NAME ? 'step' : false}
                        onClick={() => onChange({ ...model, step: StepSieve.NAME })}
                        className="breadcrumb-button"
                    >
                        {c('StepSieve in filter modal').t`Name`}
                    </button>
                </li>
                <li className="breadcrumb-item">
                    <button
                        type="button"
                        disabled={model.step === StepSieve.SIEVE || !!errors.name}
                        aria-current={model.step === StepSieve.SIEVE ? 'step' : false}
                        onClick={() => onChange({ ...model, step: StepSieve.SIEVE })}
                        className="breadcrumb-button"
                    >
                        {c('StepSieve in filter modal').t`Sieve editor`}
                    </button>
                </li>
            </ul>
        </header>
    );
};

export default HeaderAdvancedFilterModal;
