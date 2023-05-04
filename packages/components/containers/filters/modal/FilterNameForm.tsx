import { KeyboardEvent } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';

import { Field } from '../../../components';
import { classnames } from '../../../helpers';
import { AdvancedSimpleFilterModalModel, SimpleFilterModalModel, Step } from '../interfaces';

interface Errors {
    name: string;
}

interface Props {
    isNarrow: boolean;
    model: SimpleFilterModalModel | AdvancedSimpleFilterModalModel;
    errors: Errors;
    onChange: (newModel: SimpleFilterModalModel | AdvancedSimpleFilterModalModel) => void;
    isSieveFilter?: boolean;
    loading: boolean;
}

const FilterNameForm = ({ isSieveFilter = false, isNarrow, model, errors, onChange, loading }: Props) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading && !errors.name) {
            e.preventDefault();
            e.stopPropagation();

            if (isSieveFilter) {
                onChange({
                    ...model,
                } as AdvancedSimpleFilterModalModel);

                return;
            }
            onChange({
                ...model,
                step: Step.CONDITIONS,
            } as SimpleFilterModalModel);
        }
    };

    return (
        <>
            {!isSieveFilter && (
                <div className="mb-4">
                    {c('Info')
                        .t`Filters work on all emails, including incoming as well as sent emails. Each filter must contain at least a name, a condition and an action.`}
                </div>
            )}
            <div className="flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1">
                <label htmlFor="name" className={classnames(['w20 pt0-5', isNarrow && 'mb-4'])}>
                    {c('Label').t`Filter Name`}
                </label>
                <Field className={classnames([!isNarrow && 'ml-4'])}>
                    <Input
                        id="name"
                        placeholder={c('Placeholder').t`Name`}
                        value={model.name}
                        error={errors.name}
                        onValue={(value) => onChange({ ...model, name: value })}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        required
                        data-testid="filter-modal:name-input"
                    />
                </Field>
            </div>
        </>
    );
};

export default FilterNameForm;
