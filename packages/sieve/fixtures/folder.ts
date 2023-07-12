/*
 * Sieve/Tree test inputs
 */
import {
    ConditionComparator,
    ConditionType,
    FilterStatement,
    SimpleObject,
} from '@proton/components/containers/filters/interfaces';

const tree = [
    {
        List: ['fileinto', 'imap4flags'],
        Type: 'Require',
    },
    {
        If: {
            Tests: [
                {
                    Headers: ['Subject'],
                    Keys: ['Order'],
                    Match: {
                        Type: 'Contains',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    Type: 'Header',
                },
            ],
            Type: 'AllOf',
        },
        Then: [
            {
                Type: 'FileInto',
                Name: 'important',
            },
            {
                Type: 'FileInto',
                Name: 'Folder',
            },
            {
                Type: 'AddFlag',
                Flags: ['\\Seen'],
            },
            {
                Type: 'Keep',
            },
        ],
        Type: 'If',
    },
];

const simple: SimpleObject = {
    Operator: {
        label: 'All',
        value: FilterStatement.ALL,
    },
    Conditions: [
        {
            Values: ['Order'],
            Type: {
                label: 'Subject',
                value: ConditionType.SUBJECT,
            },
            Comparator: {
                label: 'contains',
                value: ConditionComparator.CONTAINS,
            },
        },
    ],
    Actions: {
        FileInto: ['important', 'Folder'],
        Mark: {
            Read: true,
            Starred: false,
        },
    },
};

export default { tree, simple };
