import { templates as sieveTemplates, computeFromTree } from './sieve';
import { FILTER_VERSION, TYPES, COMPARATORS, OPERATORS } from './constants';

const find = (list = [], value) => list.find((item) => item.value === value);

const prepareID = ({ ID = '' } = {}) => ID;
const prepareName = ({ Name = '' } = {}) => Name;
const prepareStatus = ({ Status = 1 } = {}) => Status;
const prepareVersion = ({ Version = FILTER_VERSION } = {}) => Version;
const prepareOperator = ({ Simple = {} } = {}) => {
    const { value = 'all' } = Simple.Operator || {};
    return find(OPERATORS, value);
};

function prepareConditions({ Simple = {} } = {}) {
    const { Conditions = [] } = Simple;

    const conditions = Conditions.map(({ Type = {}, Comparator = {}, Values = [], value = '' }) => ({
        value: value ? '' : value,
        Type: find(TYPES, Type.value),
        Values: value ? Values.concat(value) : Values,
        Comparator: find(COMPARATORS, Comparator.value),
    }));

    if (!conditions.length) {
        conditions.push({
            value: '',
            Values: [],
            Type: TYPES[0],
            Comparator: COMPARATORS[0],
        });
    }

    return conditions;
}

function prepareActions({ Simple = {} } = {}, labels = []) {
    const { FileInto = [], Mark = { Read: false, Starred: false }, Vacation = '' } = Simple.Actions || {};

    const Actions = {
        Labels: labels.map((label) => {
            label.Selected = FileInto.includes(label.Name);
            return label;
        }),
        FileInto,
        Vacation,
        Mark,
    };

    return Actions;
}

const prepareSieveTemplate = ({ Sieve } = {}, { Version }) => {
    return Sieve || sieveTemplates[Version] || '';
};

function main(model = {}, mode) {
    const config = {
        ID: prepareID(model),
        Name: prepareName(model),
        Status: prepareStatus(model),
        Version: prepareVersion(model),
    };

    if (mode === 'simple') {
        return {
            ...config,
            Simple: {
                Operator: prepareOperator(model),
                Conditions: prepareConditions(model),
                Actions: prepareActions(model),
            },
        };
    }

    if (mode === 'complex') {
        return {
            ...config,
            Sieve: prepareSieveTemplate(model, config),
        };
    }

    return config;
}

export function newFilter(filter, mode = 'simple') {
    if (filter) {
        const simple = computeFromTree(filter);
        if (!simple) {
            delete filter.Simple;
        } else {
            filter.Simple = simple;
        }
        return filter;
    }

    return main(filter, mode);
}

export default main;
