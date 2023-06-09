import { useEffect, useState } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { Radio, UnderlineButton } from '../../../components';
import { generateUID } from '../../../helpers';
import { Condition, ConditionComparator, ConditionType, FilterStatement, SimpleFilterModalModel } from '../interfaces';
import FilterConditionsFormRow from './FilterConditionsFormRow';

const generateNewCondition = () => ({
    type: ConditionType.SELECT,
    comparator: ConditionComparator.CONTAINS,
    isOpen: true,
    id: generateUID('condition'),
});

interface Props {
    isNarrow: boolean;
    model: SimpleFilterModalModel;
    onChange: (newModel: SimpleFilterModalModel) => void;
    isEdit: boolean;
}

const FilterConditionsForm = ({ isEdit, isNarrow, model, onChange }: Props) => {
    const [conditions, setConditions] = useState<Condition[]>(
        model.conditions.length ? model.conditions : [generateNewCondition()]
    );

    const onAddCondition = () => {
        setConditions((conditions: Condition[]) => {
            return [...conditions, { ...generateNewCondition() }];
        });
    };

    const onDeleteCondition = (i: number) => {
        setConditions((conditions: Condition[]) => {
            conditions.splice(i, 1);
            return [...conditions];
        });
    };

    const onUpdateCondition = (index: number, condition: Condition) => {
        setConditions((conditions: Condition[]) => {
            conditions[index] = condition;
            return [...conditions];
        });
    };

    useEffect(() => {
        onChange({ ...model, conditions });
    }, [conditions]);

    return (
        <>
            <div className="flex flex-nowrap mb-0 on-mobile-flex-column border-bottom">
                <div className={clsx(['w20', isNarrow && 'mb-4'])}>{c('Label').t`Statement`}</div>
                <div className={clsx([!isNarrow && 'ml-4'])}>
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
                        isNarrow={isNarrow}
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
