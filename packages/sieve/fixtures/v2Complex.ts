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
        Text: '/**\r\n * @type or\r\n * @comparator starts\r\n * @comparator starts\r\n * @comparator ends\r\n * @comparator default\r\n */',
        Type: 'Comment',
    },
    {
        If: {
            Tests: [
                {
                    Headers: ['Subject'],
                    Keys: ['subject*'],
                    Match: {
                        Type: 'Matches',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    Type: 'Header',
                },
                {
                    Headers: ['From'],
                    Keys: ['\\\\*\\\\?\\\\sender\\\\\\\\?\\\\**'],
                    Match: {
                        Type: 'Matches',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    AddressPart: {
                        Type: 'All',
                    },
                    Type: 'Address',
                },
                {
                    Headers: ['To', 'Cc', 'Bcc'],
                    Keys: ['*\\\\*\\\\?\\\\recipient\\\\\\\\?\\\\*'],
                    Match: {
                        Type: 'Matches',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    AddressPart: {
                        Type: 'All',
                    },
                    Type: 'Address',
                },
                {
                    Headers: ['X-Attached'],
                    Type: 'Exists',
                },
            ],
            Type: 'AnyOf',
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
        label: 'Any',
        value: FilterStatement.ANY,
    },
    Conditions: [
        {
            Type: {
                label: 'Subject',
                value: ConditionType.SUBJECT,
            },
            Comparator: {
                label: 'begins with',
                value: ConditionComparator.STARTS,
            },
            Values: ['subject'],
        },
        {
            Type: {
                label: 'Sender',
                value: ConditionType.SENDER,
            },
            Comparator: {
                label: 'begins with',
                value: ConditionComparator.STARTS,
            },
            Values: ['*?\\sender\\?*'],
        },
        {
            Type: {
                label: 'Recipient',
                value: ConditionType.RECIPIENT,
            },
            Comparator: {
                label: 'ends with',
                value: ConditionComparator.ENDS,
            },
            Values: ['*?\\recipient\\?*'],
        },
        {
            Type: {
                label: 'Attachments',
                value: ConditionType.ATTACHMENTS,
            },
            Comparator: {
                label: 'contains',
                value: ConditionComparator.CONTAINS,
            },
            Values: [],
        },
    ],
    Actions: {
        FileInto: [],
        Mark: {
            Read: true,
            Starred: false,
        },
    },
};

export default { tree, simple };
