import { FILTER_VERSION, OPERATORS, TYPES, COMPARATORS } from './constants';
import {
    FilterOperator,
    FilterCondition,
    FilterActions,
    SimpleFilterModalModel,
    Filter,
    AdvancedSimpleFilterModalModel,
} from './interfaces';
import { toMap } from '../helpers/object';
import { computeTree, computeFromTree } from './sieve';

const convertOperator = ({ statement }: SimpleFilterModalModel): FilterOperator => {
    const operatorsMap = toMap(OPERATORS, 'value');
    return operatorsMap[statement];
};

const convertConditions = ({ conditions }: SimpleFilterModalModel): FilterCondition[] => {
    const comparatorsMap = toMap(COMPARATORS, 'value');
    const typesMap = toMap(TYPES, 'value');

    return conditions.map((cond) => ({
        Comparator: comparatorsMap[cond.comparator],
        Type: typesMap[cond.type],
        Values: cond.values || [],
    }));
};

const convertActions = ({ actions }: SimpleFilterModalModel): FilterActions => {
    const {
        labelAs: { labels },
        moveTo: { folder },
        markAs,
        autoReply,
    } = actions;

    return {
        FileInto: folder ? [folder, ...labels] : [...labels],
        // Labels: [...labels],
        Mark: {
            Read: markAs.read,
            Starred: markAs.starred,
        },
        Vacation: autoReply || null,
    };
};

export const convertModel = (
    modalModel: SimpleFilterModalModel | AdvancedSimpleFilterModalModel,
    isSieve = false
): Filter => {
    const config = {
        ID: modalModel.id || '',
        Name: modalModel.name || '',
        Status: modalModel.status || 1,
        Version: modalModel.version || FILTER_VERSION,
    };

    if (isSieve) {
        const model = modalModel as AdvancedSimpleFilterModalModel;

        return {
            ...config,
            Sieve: model.sieve || '',
        };
    }

    const newModel = {
        ...config,
        Simple: {
            Operator: convertOperator(modalModel as SimpleFilterModalModel),
            Conditions: convertConditions(modalModel as SimpleFilterModalModel),
            Actions: convertActions(modalModel as SimpleFilterModalModel),
        },
    };

    return {
        ...newModel,
        Tree: computeTree(newModel),
    };
};

export const isComplex = (filter: Filter) => {
    return !computeFromTree(filter);
};
