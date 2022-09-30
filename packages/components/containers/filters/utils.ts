import Sieve from '@proton/shared/lib/filters/sieve';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { toMap } from '@proton/shared/lib/helpers/object';

import { COMPARATORS, FILTER_VERSION, OPERATORS, TYPES, getDefaultFolders } from './constants';
import {
    Filter,
    FilterActions,
    FilterCondition,
    FilterModalModelBase,
    FilterOperator,
    SimpleFilterModalModel,
} from './interfaces';

export const computeFromTree = (filter: Filter) => {
    const ignoreComment = ({ Type }: any) => Type !== 'Comment';

    const simple = Sieve.fromTree(filter.Tree);
    const fromSimple = Sieve.toTree(simple, filter.Version).filter(ignoreComment);
    const original = filter.Tree.filter(ignoreComment);
    return isDeepEqual(fromSimple, original) ? simple : null;
};

export const computeTree = ({ Simple, Version }: Partial<Filter>) => {
    if (!Simple) {
        return [];
    }
    return Sieve.toTree(Simple, Version);
};

export function normalize() {
    const SINGLE_QUOTE = "'";
    const DOUBLE_QUOTE = '"';
    const SINGLE_QUOTE_REGEXP = new RegExp(`[${['‹', '›', '‚', '‘', '‛', '’', '❛', '❜', '❮', '❯'].join('')}]`, 'g');
    const DOUBLE_QUOTE_REGEXP = new RegExp(
        `[${['«', '»', '„', '“', '‟', '”', '❝', '❞', '〝', '〞', '〟', '＂'].join('')}]`,
        'g'
    );

    return (value = '') => {
        if (SINGLE_QUOTE_REGEXP.test(value) || DOUBLE_QUOTE_REGEXP.test(value)) {
            return value.replace(SINGLE_QUOTE_REGEXP, SINGLE_QUOTE).replace(DOUBLE_QUOTE_REGEXP, DOUBLE_QUOTE);
        }
        return value;
    };
}

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
        Mark: {
            Read: markAs.read,
            Starred: markAs.starred,
        },
        Vacation: autoReply || null,
    };
};

export const convertModel = (modalModel: FilterModalModelBase, isSieve = false): Filter => {
    const config = {
        ID: modalModel.id || '',
        Name: modalModel.name || '',
        Status: modalModel.status || 1,
        Version: modalModel.version || FILTER_VERSION,
    };

    if (isSieve) {
        const model = modalModel as FilterModalModelBase & { sieve: string };

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

export const isSieve = (filter: Filter) => {
    return !computeFromTree(filter);
};

export const sieveTemplates = {
    1: '',
    2: `require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest"];

# Generated: Do not run this script on spam messages
if allof (environment :matches "vnd.proton.spam-threshold" "*",
spamtest :value "ge" :comparator "i;ascii-numeric" "\${1}")
{
    return;
}


`,
};

export const newFilter = (): Filter => {
    return {
        ID: '',
        Name: '',
        Status: 1,
        Version: FILTER_VERSION,
        Simple: {
            Operator: {
                label: OPERATORS[0].label,
                value: OPERATORS[0].value,
            },
            Conditions: [
                {
                    Values: [],
                    Type: TYPES[0],
                    Comparator: COMPARATORS[0],
                },
            ],
            Actions: {
                FileInto: [],
                Vacation: '',
                Mark: { Read: false, Starred: false },
            },
        },
    };
};

/**
 * Return a filter name based on baseName but unique in the list of existing filters
 */
export const createUniqueName = (baseName: string, filters: Filter[]) => {
    let filterName = baseName;
    let counter = 1;
    const isAlreadyUsed = (name: string) => filters.some((filter) => filter.Name === name);
    while (isAlreadyUsed(filterName)) {
        filterName = `${filterName} ${counter++}`;
    }
    return filterName;
};

export const createDefaultLabelsFilter = (
    senders: string[],
    labels: { ID: string; Name: string; Path: string }[],
    filters: Filter[]
) => {
    return senders.map<Filter>((sender) => {
        const labelNames = labels.map((label) => label.Name).join(', ');
        const Name = createUniqueName(`${sender} - ${labelNames}`, filters);
        const filter: Filter = {
            ID: '',
            Name,
            Status: 1,
            Version: FILTER_VERSION,
            Simple: {
                Operator: {
                    label: OPERATORS[0].label,
                    value: OPERATORS[0].value,
                },
                Conditions: [
                    {
                        Values: [sender],
                        Type: TYPES[2],
                        Comparator: COMPARATORS[1],
                    },
                ],
                Actions: {
                    FileInto: labels.map((label) => {
                        // We need to send the label Name as action here.
                        // In case it's a default folder, we want to make sure the folder is sent the correct way (without upper cases)
                        const defaultFolderNames = getDefaultFolders().map((f) => f.value);
                        if (defaultFolderNames.includes(label.Name.toLowerCase())) {
                            return label.Name.toLowerCase();
                        }
                        return label.Path;
                    }),
                    Vacation: '',
                    Mark: { Read: false, Starred: false },
                },
            },
        };
        filter.Tree = computeTree(filter);
        return filter;
    }, []);
};

export default newFilter;
