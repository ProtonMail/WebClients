import React from 'react';
import { c } from 'ttag';

import { AdvancedSimpleFilterModalModel, StepSieve, ErrorsSieve } from '../../interfaces';
import { Breadcrumb } from '../../../../components';

interface Props {
    model: AdvancedSimpleFilterModalModel;
    onChange: (newModel: AdvancedSimpleFilterModalModel) => void;
    errors: ErrorsSieve;
}

const HeaderAdvancedFilterModal = ({ model, errors, onChange }: Props) => {
    const list = [
        { step: StepSieve.NAME, content: c('Step in filter modal').t`Name` },
        { step: StepSieve.SIEVE, content: c('Step in filter modal').t`Sieve editor` },
    ];
    const getIsDisabled = (index: number) => {
        const target = list[index];
        if (!target) {
            return false;
        }
        const { step } = target;
        if (step === StepSieve.SIEVE && !!errors.name) {
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

export default HeaderAdvancedFilterModal;
