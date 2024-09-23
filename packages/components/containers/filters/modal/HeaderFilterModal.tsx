import { c } from 'ttag';

import Breadcrumb from '../../../components/breadcrumb/Breadcrumb';
import type { Errors, SimpleFilterModalModel } from '../interfaces';
import { Step } from '../interfaces';

interface Props {
    model: SimpleFilterModalModel;
    onChange: (newModel: SimpleFilterModalModel) => void;
    errors: Errors;
}

const HeaderFilterModal = ({ model, errors, onChange }: Props) => {
    const list = [
        { step: Step.NAME, content: c('Step in filter modal').t`Name` },
        { step: Step.CONDITIONS, content: c('Step in filter modal').t`Conditions` },
        { step: Step.ACTIONS, content: c('Step in filter modal').t`Actions` },
        { step: Step.PREVIEW, content: c('Step in filter modal').t`Preview` },
    ];
    const getIsDisabled = (index: number) => {
        const target = list[index];
        if (!target) {
            return false;
        }
        const { step } = target;
        if (step === Step.CONDITIONS && !!errors.name) {
            return true;
        }
        if (step === Step.ACTIONS && (!!errors.name || !!errors.conditions)) {
            return true;
        }
        if (step === Step.PREVIEW && (!!errors.name || !!errors.actions || !!errors.conditions)) {
            return true;
        }
        return false;
    };
    return (
        <header>
            <Breadcrumb
                onClick={(index) => {
                    const target = list[index];
                    if (!target) {
                        return;
                    }
                    const { step } = target;
                    onChange({ ...model, step });
                }}
                getIsDisabled={getIsDisabled}
                current={list.findIndex(({ step }) => step === model.step)}
                list={list.map(({ content }) => content)}
            />
        </header>
    );
};

export default HeaderFilterModal;
