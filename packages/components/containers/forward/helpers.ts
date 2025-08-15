import { toMap } from '@proton/shared/lib/helpers/object';
import { fromSieveTree, toSieveTree } from '@proton/sieve';
import type { SIEVE_VERSION, SieveBranch } from '@proton/sieve/src/interface';
import generateUID from '@proton/utils/generateUID';

import { COMPARATORS, OPERATORS, TYPES } from '../filters/constants';
import type { Condition, FilterCondition, FilterOperator } from '../filters/interfaces';
import { FilterStatement } from '../filters/interfaces';

const toSieveOperator = (statement: FilterStatement): FilterOperator => {
    const operatorsMap = toMap(OPERATORS, 'value');
    return operatorsMap[statement];
};

const toSieveConditions = (conditions: Condition[]): FilterCondition[] => {
    const comparatorsMap = toMap(COMPARATORS, 'value');
    const typesMap = toMap(TYPES, 'value');

    return conditions.map((cond) => ({
        Comparator: comparatorsMap[cond.comparator],
        Type: typesMap[cond.type],
        Values: cond.values || [],
    }));
};

export const getSieveTree = ({
    conditions,
    statement,
    version = 2,
    email,
}: {
    conditions: Condition[];
    statement: FilterStatement;
    version?: SIEVE_VERSION;
    email: string;
}): SieveBranch[] | null => {
    if (conditions.length === 0) {
        return null;
    }
    return toSieveTree(
        {
            Operator: toSieveOperator(statement),
            Conditions: toSieveConditions(conditions),
            Actions: {
                FileInto: [],
                Vacation: '',
                Mark: { Read: false, Starred: false },
                Redirects: [{ Address: email, Copy: true }],
            },
        },
        version
    );
};

export const getSieveParameters = (tree: SieveBranch[]): { conditions: Condition[]; statement: FilterStatement } => {
    const simple = fromSieveTree(tree);
    if (!simple) {
        return {
            conditions: [],
            statement: FilterStatement.ALL,
        };
    }
    return {
        conditions:
            simple.Conditions.map((cond) => ({
                type: cond.Type.value,
                comparator: cond.Comparator.value,
                values: cond.Values || [],
                isOpen: true,
                defaultValue: cond.Values[0] || '',
                id: generateUID('condition'),
            })) || [],
        statement: simple.Operator?.value || FilterStatement.ALL,
    };
};
