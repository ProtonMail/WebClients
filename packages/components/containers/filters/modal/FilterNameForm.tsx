import type { KeyboardEvent } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import { useNotifications } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import Field from '../../../components/container/Field';
import type { AdvancedSimpleFilterModalModel, SimpleFilterModalModel } from '../interfaces';
import { Step } from '../interfaces';

interface Errors {
    name: string;
}

interface Props {
    model: SimpleFilterModalModel | AdvancedSimpleFilterModalModel;
    errors: Errors;
    onChange: (newModel: SimpleFilterModalModel | AdvancedSimpleFilterModalModel) => void;
    isSieveFilter?: boolean;
    loading: boolean;
}

const FilterNameForm = ({ isSieveFilter = false, model, errors, onChange, loading }: Props) => {
    const { createNotification } = useNotifications();

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (!loading && !errors.name) {
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
            } else {
                // If there is an error in the name, it can be for two reasons:
                // - The filter has no name or contains spaces only
                // - The filter has a name that is already used

                if (model.name.length === 0) {
                    createNotification({
                        text: c('Title').t`A filter name is required`,
                        type: 'error',
                    });
                } else if (model.name.trim() === '') {
                    createNotification({
                        text: c('Title').t`Filter name cannot contain only spaces`,
                        type: 'error',
                    });
                } else if (model.name.length > 0) {
                    createNotification({
                        text: c('Title').t`A filter with this name already exists`,
                        type: 'error',
                    });
                }
            }
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
            <div className="flex flex-nowrap flex-column md:flex-row align-items-center py-4 gap-4">
                <label htmlFor="name" className={clsx(['w-1/5 pt-2'])}>
                    {c('Label').t`Filter Name`}
                </label>
                <Field>
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
