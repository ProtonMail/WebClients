import React from 'react';
import { c } from 'ttag';

import { AdvancedSimpleFilterModalModel, StepSieve, ErrorsSieve } from 'proton-shared/lib/filters/interfaces';
import { Button, PrimaryButton } from '../../../../components';

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
    return (
        <>
            {model.step === StepSieve.NAME ? (
                <Button disabled={loading} onClick={onClose}>{c('Action').t`Cancel`}</Button>
            ) : (
                <Button disabled={loading} onClick={handleBack}>{c('Action').t`Back`}</Button>
            )}
            <div>
                {model.step === StepSieve.NAME && (
                    <Button disabled={loading || !!errors.name} onClick={handleNext} className="mr1">{c('Action')
                        .t`Next`}</Button>
                )}
                <PrimaryButton disabled={loading || !!errors.name || !!errors.sieve} type="submit">{c('Action')
                    .t`Save`}</PrimaryButton>
            </div>
        </>
    );
};

export default FooterAdvancedFilterModal;
