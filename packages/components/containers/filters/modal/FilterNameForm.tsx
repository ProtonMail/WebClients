import { ChangeEvent } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { Alert, Field, Input } from '../../../components';
import { classnames } from '../../../helpers';

import { SimpleFilterModalModel, AdvancedSimpleFilterModalModel, Step, StepSieve } from '../interfaces';

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
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading && !errors.name) {
            e.preventDefault();
            e.stopPropagation();

            if (isSieveFilter) {
                onChange({
                    ...model,
                    step: StepSieve.SIEVE,
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
            <Alert>
                {isSieveFilter
                    ? c('Info')
                          .t`Filters work on all emails, including incoming as well as sent emails. Each filter must contain at least a name and a valid Sieve script.`
                    : c('Info')
                          .t`Filters work on all emails, including incoming as well as sent emails. Each filter must contain at least a name, a condition and an action.`}
            </Alert>
            <div className="flex flex-nowrap on-mobile-flex-column align-items-center pt1 pb1">
                <label htmlFor="name" className={classnames(['w20 pt0-5', isNarrow && 'mb1'])}>
                    {c('Label').t`Filter Name`}
                </label>
                <Field className={classnames([!isNarrow && 'ml1'])}>
                    <Input
                        id="name"
                        placeholder={c('Placeholder').t`Name`}
                        value={model.name}
                        error={errors.name}
                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                            onChange({ ...model, name: target.value })
                        }
                        onKeyDown={handleKeyDown}
                        autoFocus
                        required
                    />
                </Field>
            </div>
        </>
    );
};

export default FilterNameForm;
