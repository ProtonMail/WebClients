import {
    ConditionComparator,
    ConditionType,
    FilterStatement,
    SimpleObject,
} from '@proton/components/containers/filters/interfaces';

const tree = [
    {
        List: ['include', 'environment', 'variables', 'relational', 'comparator-i;ascii-numeric', 'spamtest'],
        Type: 'Require',
    },
    {
        List: ['fileinto', 'imap4flags'],
        Type: 'Require',
    },
    {
        Text: '# Generated: Do not run this script on spam messages',
        Type: 'Comment',
    },
    {
        If: {
            Tests: [
                {
                    Name: 'vnd.proton.spam-threshold',
                    Keys: ['*'],
                    Format: null,
                    Match: {
                        Type: 'Matches',
                    },
                    Type: 'Environment',
                },
                {
                    Value: {
                        Value: '${1}',
                        Type: 'VariableString',
                    },
                    Flags: [],
                    Format: {
                        Type: 'ASCIINumeric',
                    },
                    Match: {
                        Comparator: 'ge',
                        Type: 'GreaterEqualsValue',
                    },
                    Type: 'SpamTest',
                },
            ],
            Type: 'AllOf',
        },
        Then: [
            {
                Type: 'Return',
            },
        ],
        Type: 'If',
    },
    {
        Text: '/**\r\n * @type and\r\n * @comparator contains\r\n */',
        Type: 'Comment',
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
