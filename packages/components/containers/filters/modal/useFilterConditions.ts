import { useEffect, useState } from 'react';

import generateUID from '@proton/utils/generateUID';

import type { Condition } from '../interfaces';
import { ConditionComparator, ConditionType } from '../interfaces';

const generateNewCondition = () => ({
    type: ConditionType.SUBJECT,
    comparator: ConditionComparator.CONTAINS,
    isOpen: true,
    id: generateUID('condition'),
});

const useFilterConditions = (
    initialConditions?: Condition[],
    onChangeConditions?: (conditions: Condition[]) => void
) => {
    const [conditions, setConditions] = useState<Condition[]>(initialConditions || [generateNewCondition()]);

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
        onChangeConditions?.(conditions);
    }, [conditions]);

    return {
        conditions,
        onAddCondition,
        onDeleteCondition,
        onUpdateCondition,
    };
};

export default useFilterConditions;
