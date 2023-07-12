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
                    Headers: ['From'],
                    Keys: ['From'],
                    Match: {
                        Type: 'Contains',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    AddressPart: {
                        Type: 'All',
                    },
                    Type: 'Address',
                },
            ],
            Type: 'AllOf',
        },
        Then: [
            {
                Flags: ['\\Seen'],
                Type: 'AddFlag',
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
            Values: ['From'],
            Type: {
                label: 'Sender',
                value: ConditionType.SENDER,
            },
            Comparator: {
                label: 'contains',
                value: ConditionComparator.CONTAINS,
            },
        },
    ],
    Actions: {
        Mark: {
            Read: true,
            Starred: false,
        },
        FileInto: [],
    },
};

export default { tree, simple };
