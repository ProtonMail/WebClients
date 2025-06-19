import { c } from 'ttag';

import { Button } from '@proton/atoms';

import type { Condition, FilterStatement } from '../filters/interfaces';
import useFilterConditions from '../filters/modal/useFilterConditions';
import ForwardCondition from './ForwardCondition';

interface Props {
    conditions?: Condition[];
    statement: FilterStatement;
    onChangeStatement: (statement: FilterStatement) => void;
    validator: (validations: string[]) => string;
    onChangeConditions: (conditions: Condition[]) => void;
}

const ForwardConditions = ({
    statement,
    onChangeStatement,
    validator,
    conditions: initialConditions,
    onChangeConditions,
}: Props) => {
    const { conditions, onAddCondition, onDeleteCondition, onUpdateCondition } = useFilterConditions(
        initialConditions,
        onChangeConditions
    );

    return (
        <>
            <div className="mb-2">
                {conditions.map((condition, index) => (
                    <ForwardCondition
                        index={index}
                        key={condition.id}
                        condition={condition}
                        displayDelete
                        onDelete={() => onDeleteCondition(index)}
                        onUpdate={(newCondition) => onUpdateCondition(index, newCondition)}
                        statement={statement}
                        validator={validator}
                        onChangeStatement={onChangeStatement}
                    />
                ))}
            </div>
            {conditions.every((c) => !c.error) && (
                <Button shape="underline" color="norm" onClick={onAddCondition}>{c('email_forwarding_2023: Action')
                    .t`Add condition`}</Button>
            )}
        </>
    );
};

export default ForwardConditions;
