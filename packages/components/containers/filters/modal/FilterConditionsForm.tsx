import { c } from 'ttag';

import UnderlineButton from '@proton/components/components/button/UnderlineButton';
import Radio from '@proton/components/components/input/Radio';
import clsx from '@proton/utils/clsx';

import type { SimpleFilterModalModel } from '../interfaces';
import { FilterStatement } from '../interfaces';
import FilterConditionsFormRow from './FilterConditionsFormRow';
import useFilterConditions from './useFilterConditions';

interface Props {
    model: SimpleFilterModalModel;
    onChange: (newModel: SimpleFilterModalModel) => void;
    isEdit: boolean;
}

const FilterConditionsForm = ({ isEdit, model, onChange }: Props) => {
    const { conditions, onDeleteCondition, onUpdateCondition, onAddCondition } = useFilterConditions(
        model.conditions.length ? model.conditions : undefined,
        (conditions) => onChange({ ...model, conditions })
    );

    return (
        <>
            <div className="flex flex-nowrap flex-column md:flex-row mb-0 border-bottom gap-4">
                <div className={clsx(['w-full md:w-1/4'])}>{c('Label').t`Statement`}</div>
                <div className={clsx(['inline-flex w-full'])}>
                    <Radio
                        id="statement-all"
                        name="filterConditionStatement"
                        className="flex flex-nowrap mb-4 radio--ontop"
                        checked={model.statement === FilterStatement.ALL}
                        onChange={() =>
                            onChange({
                                ...model,
                                statement: FilterStatement.ALL,
                            })
                        }
                    >
                        {c('Label').t`ALL`}
                        <em className="ml-2">{c('Info').t`(Filter if ALL of the following conditions are met)`}</em>
                    </Radio>
                    <Radio
                        id="statement-any"
                        name="filterConditionStatement"
                        className="flex flex-nowrap mb-4 radio--ontop"
                        checked={model.statement === FilterStatement.ANY}
                        onChange={() =>
                            onChange({
                                ...model,
                                statement: FilterStatement.ANY,
                            })
                        }
                    >
                        {c('Label').t`ANY`}
                        <em className="ml-2">{c('Info').t`(Filter if ANY of the following conditions are met)`}</em>
                    </Radio>
                </div>
            </div>
            <div className="mb-2">
                {conditions.map((condition, i) => (
                    <FilterConditionsFormRow
                        isEdit={isEdit}
                        key={condition.id}
                        condition={condition}
                        conditionIndex={i}
                        handleDelete={onDeleteCondition}
                        handleUpdateCondition={onUpdateCondition}
                        statement={model.statement}
                        displayDelete={conditions.length > 1}
                    />
                ))}
            </div>
            {conditions.every((c) => !c.error) && (
                <UnderlineButton onClick={onAddCondition} className="my-2">
                    <strong>{c('Action').t`Add condition`}</strong>
                </UnderlineButton>
            )}
        </>
    );
};

export default FilterConditionsForm;
