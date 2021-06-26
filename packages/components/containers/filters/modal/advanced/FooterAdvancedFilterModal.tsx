import React from 'react';
import { c } from 'ttag';

import { StepSieve, AdvancedSimpleFilterModalModel, ErrorsSieve } from '../../interfaces';
import { Button } from '../../../../components';

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onClose: () => void;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
    loading: boolean;
    errors: ErrorsSieve;
}

const NEXT_STEP = {
    [StepSieve.NAME]: StepSieve.SIEVE,
    [StepSieve.SIEVE]: StepSieve.SIEVE,
};

const BACK_STEP = {
    [StepSieve.NAME]: StepSieve.NAME,
    [StepSieve.SIEVE]: StepSieve.NAME,
};

const FooterAdvancedFilterModal = ({ model, errors, onClose, onChange, loading }: Props) => {
    const handleNext = () => {
        onChange({ ...model, step: NEXT_STEP[model.step] });
    };

    const handleBack = () => {
        onChange({ ...model, step: BACK_STEP[model.step] });
    };

    const disabled = loading || !!errors.name;

    return (
        <>
            {model.step === StepSieve.NAME ? (
                <Button shape="outline" disabled={loading} onClick={onClose}>{c('Action').t`Cancel`}</Button>
            ) : (
                <Button shape="outline" disabled={loading} onClick={handleBack}>{c('Action').t`Back`}</Button>
            )}
            <div>
                {model.step === StepSieve.NAME && (
                    <Button shape="outline" disabled={disabled} onClick={handleNext} className="mr1">{c('Action')
                        .t`Next`}</Button>
                )}
                <Button color="norm" disabled={disabled} type="submit">{c('Action').t`Save`}</Button>
            </div>
        </>
    );
};

export default FooterAdvancedFilterModal;
