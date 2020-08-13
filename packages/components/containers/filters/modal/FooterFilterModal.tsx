import React from 'react';
import { c } from 'ttag';

import { SimpleFilterModalModel, Step, Errors } from 'proton-shared/lib/filters/interfaces';
import { Button, PrimaryButton } from '../../../components';

interface Props {
    model: SimpleFilterModalModel;
    onClose: () => void;
    onChange: (newModel: SimpleFilterModalModel) => void;
    loading: boolean;
    errors: Errors;
}

const NEXT_STEP = {
    [Step.NAME]: Step.CONDITIONS,
    [Step.CONDITIONS]: Step.ACTIONS,
    [Step.ACTIONS]: Step.PREVIEW,
    [Step.PREVIEW]: Step.PREVIEW,
};

const BACK_STEP = {
    [Step.NAME]: Step.NAME,
    [Step.CONDITIONS]: Step.NAME,
    [Step.ACTIONS]: Step.CONDITIONS,
    [Step.PREVIEW]: Step.ACTIONS,
};

const FooterFilterModal = ({ model, errors, onClose, onChange, loading }: Props) => {
    const handleNext = () => {
        onChange({ ...model, step: NEXT_STEP[model.step] });
    };
    const handleBack = () => {
        onChange({ ...model, step: BACK_STEP[model.step] });
    };
    return (
        <>
            {model.step === Step.NAME ? (
                <Button disabled={loading} onClick={onClose}>{c('Action').t`Cancel`}</Button>
            ) : (
                <Button disabled={loading} onClick={handleBack}>{c('Action').t`Back`}</Button>
            )}
            <div>
                {model.step === Step.NAME && (
                    <Button disabled={loading || !!errors.name} onClick={handleNext} className="mr1">{c('Action')
                        .t`Next`}</Button>
                )}
                {model.step === Step.CONDITIONS && (
                    <Button
                        disabled={loading || !!errors.name || !!errors.conditions}
                        onClick={handleNext}
                        className="mr1"
                    >{c('Action').t`Next`}</Button>
                )}
                {model.step === Step.ACTIONS && (
                    <Button
                        disabled={loading || !!errors.name || !!errors.conditions || !!errors.actions}
                        onClick={handleNext}
                        className="mr1"
                    >{c('Action').t`Next`}</Button>
                )}
                <PrimaryButton
                    disabled={loading || !!errors.name || !!errors.conditions || !!errors.actions}
                    type="submit"
                >{c('Action').t`Save`}</PrimaryButton>
            </div>
        </>
    );
};

export default FooterFilterModal;
