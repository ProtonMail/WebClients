import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import type { Errors, SimpleFilterModalModel } from '../interfaces';
import { Step } from '../interfaces';

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
    const { step } = model;

    const handleNext = () => {
        onChange({ ...model, step: NEXT_STEP[step] });
    };
    const handleBack = () => {
        onChange({ ...model, step: BACK_STEP[step] });
    };

    const isNextButtonDisabled = () => {
        if (step === Step.CONDITIONS) {
            return !!errors.conditions;
        }
        if ([Step.ACTIONS, Step.PREVIEW].includes(step)) {
            return !!errors.conditions || !!errors.actions;
        }

        return loading || !!errors.name;
    };

    return (
        <>
            {step === Step.NAME ? (
                <div>
                    <Button shape="outline" className="w-full sm:w-auto" disabled={loading} onClick={onClose}>{c(
                        'Action'
                    ).t`Cancel`}</Button>
                </div>
            ) : (
                <div>
                    <Button shape="outline" className="w-full sm:w-auto" disabled={loading} onClick={handleBack}>{c(
                        'Action'
                    ).t`Back`}</Button>
                </div>
            )}
            <div className="flex">
                {step !== Step.PREVIEW && (
                    <Button
                        shape="outline"
                        disabled={isNextButtonDisabled()}
                        onClick={handleNext}
                        className={clsx(['w-full sm:w-auto mb-2 lg:mb-0', step === Step.ACTIONS && 'sm:mr-4'])}
                        data-testid="filter-modal:next-button"
                    >
                        {step === Step.ACTIONS ? c('Action').t`Preview` : c('Action').t`Next`}
                    </Button>
                )}

                {[Step.ACTIONS, Step.PREVIEW].includes(step) && (
                    <Button
                        color="norm"
                        className="w-full sm:w-auto mb-2 lg:mb-0"
                        disabled={loading || !!errors.name || !!errors.conditions || !!errors.actions}
                        type="submit"
                    >{c('Action').t`Save`}</Button>
                )}
            </div>
        </>
    );
};

export default FooterFilterModal;
