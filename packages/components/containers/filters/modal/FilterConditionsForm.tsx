import { useState, useEffect } from 'react';
import { c } from 'ttag';

import { Condition, FilterStatement, ConditionType, ConditionComparator, SimpleFilterModalModel } from '../interfaces';
import { Radio, LinkButton } from '../../../components';
import { classnames, generateUID } from '../../../helpers';

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
            <div className="flex flex-nowrap mb0 on-mobile-flex-column border-bottom">
                <div className={classnames(['w20', isNarrow && 'mb1'])}>{c('Label').t`Statement`}</div>
                <div className={classnames([!isNarrow && 'ml1'])}>
                    <Radio
                        id="statement-all"
                        name="filterConditionStatement"
                        className="flex flex-nowrap mb1 radio--ontop"
                        checked={model.statement === FilterStatement.ALL}
                        onChange={() =>
                            onChange({
                                ...model,
                                statement: FilterStatement.ALL,
                            })
                        }
                    >
                        {c('Label').t`ALL`}
                        <em className="ml0-5">{c('Info').t`(Filter if ALL of the following conditions are met)`}</em>
                    </Radio>
                    <Radio
                        id="statement-any"
                        name="filterConditionStatement"
                        className="flex flex-nowrap mb1 radio--ontop"
                        checked={model.statement === FilterStatement.ANY}
                        onChange={() =>
                            onChange({
                                ...model,
                                statement: FilterStatement.ANY,
                            })
                        }
                    >
                        {c('Label').t`ANY`}
                        <em className="ml0-5">{c('Info').t`(Filter if ANY of the following conditions are met)`}</em>
                    </Radio>
                </div>
            </div>
            <div className="mb0-5">
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
                <LinkButton onClick={onAddCondition} className="mt0-5 mb0-5">
                    <strong>{c('Action').t`Add condition`}</strong>
                </LinkButton>
            )}
        </>
    );
};

export default FilterConditionsForm;
