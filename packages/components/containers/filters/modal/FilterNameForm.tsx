import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { SimpleFilterModalModel } from 'proton-shared/lib/filters/interfaces';

import { Alert, Field, Input } from '../../../components';
import { classnames } from '../../../helpers';

import { AdvancedSimpleFilterModalModel } from './advanced/interfaces';

interface Errors {
    name: string;
}

interface Props {
    isNarrow: boolean;
    model: SimpleFilterModalModel | AdvancedSimpleFilterModalModel;
    errors: Errors;
    onChange: (newModel: SimpleFilterModalModel | AdvancedSimpleFilterModalModel) => void;
    isSieveFilter?: boolean;
}

const FilterNameForm = ({ isSieveFilter = false, isNarrow, model, errors, onChange }: Props) => {
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
                        autoFocus
                        required
                    />
                </Field>
            </div>
        </>
    );
};

export default FilterNameForm;
