import { c } from 'ttag';

import { SimpleFilterModalModel, Step, Errors } from '../interfaces';
import { classnames } from '../../../helpers/component';
import { Button } from '../../../components';

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
                <Button shape="outline" disabled={loading} onClick={onClose}>{c('Action').t`Cancel`}</Button>
            ) : (
                <Button shape="outline" disabled={loading} onClick={handleBack}>{c('Action').t`Back`}</Button>
            )}
            <div>
                {step !== Step.PREVIEW && (
                    <Button
                        shape="outline"
                        disabled={isNextButtonDisabled()}
                        onClick={handleNext}
                        className={classnames([step === Step.ACTIONS && 'mr1'])}
                    >
                        {step === Step.ACTIONS ? c('Action').t`Preview` : c('Action').t`Next`}
                    </Button>
                )}

                {[Step.ACTIONS, Step.PREVIEW].includes(step) && (
                    <Button
                        color="norm"
                        disabled={loading || !!errors.name || !!errors.conditions || !!errors.actions}
                        type="submit"
                    >{c('Action').t`Save`}</Button>
                )}
            </div>
        </>
    );
};

export default FooterFilterModal;
