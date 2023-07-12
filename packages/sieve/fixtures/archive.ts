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
                    Test: {
                        Headers: ['Subject'],
                        Keys: ['Subject1'],
                        Match: {
                            Type: 'Contains',
                        },
                        Format: {
                            Type: 'UnicodeCaseMap',
                        },
                        Type: 'Header',
                    },
                    Type: 'Not',
                },
                {
                    Headers: ['To', 'Cc', 'Bcc'],
                    Keys: ['Recipient1'],
                    Match: {
                        Type: 'Is',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    Type: 'Address',
                    AddressPart: {
                        Type: 'All',
                    },
                },
                {
                    Test: {
                        Headers: ['To', 'Cc', 'Bcc'],
                        Keys: ['Recipient2'],
                        Match: {
                            Type: 'Matches',
                        },
                        Format: {
                            Type: 'UnicodeCaseMap',
                        },
                        Type: 'Address',
                        AddressPart: {
                            Type: 'All',
                        },
                    },
                    Type: 'Not',
                },
                {
                    Headers: ['From'],
                    Keys: ['Sender1*'],
                    Match: {
                        Type: 'Matches',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    Type: 'Address',
                    AddressPart: {
                        Type: 'All',
                    },
                },
                {
                    Test: {
                        Headers: ['From'],
                        Keys: ['*Sender2'],
                        Match: {
                            Type: 'Matches',
                        },
                        Format: {
                            Type: 'UnicodeCaseMap',
                        },
                        Type: 'Address',
                        AddressPart: {
                            Type: 'All',
                        },
                    },
                    Type: 'Not',
                },
                {
                    Test: {
                        Headers: ['X-Attached'],
                        Type: 'Exists',
                    },
                    Type: 'Not',
                },
            ],
            Type: 'AllOf',
        },
        Then: [
            {
                Name: 'panda qwe qwe qwe qweqwe qw e',
                Type: 'FileInto',
            },
            {
                Name: 'panda3',
                Type: 'FileInto',
            },
            {
                Name: 'cool',
                Type: 'FileInto',
            },
            {
                Name: 'panda2',
                Type: 'FileInto',
            },
            {
                Name: 'test',
                Type: 'FileInto',
            },
            {
                Name: 'very long label wowowowowowowowowowowowoowowowwo',
                Type: 'FileInto',
            },
            {
                Name: 'wqeqweqweqweqweqweqweqweqweqweqweqweqweqweqwe',
                Type: 'FileInto',
            },
            {
                Name: 'archive',
                Type: 'FileInto',
            },
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
            Type: {
                label: 'Subject',
                value: ConditionType.SUBJECT,
            },
            Comparator: {
                label: 'does not contain',
                value: ConditionComparator.DOES_NOT_CONTAIN,
            },
            Values: ['Subject1'],
        },
        {
            Type: {
                label: 'Recipient',
                value: ConditionType.RECIPIENT,
            },
            Comparator: {
                label: 'is exactly',
                value: ConditionComparator.IS,
            },
            Values: ['Recipient1'],
        },
        {
            Type: {
                label: 'Recipient',
                value: ConditionType.RECIPIENT,
            },
            Comparator: {
                label: 'does not match',
                value: ConditionComparator.DOES_NOT_MATCH,
            },
            Values: ['Recipient2'],
        },
        {
            Type: {
                label: 'Sender',
                value: ConditionType.SENDER,
            },
            Comparator: {
                label: 'Matches',
                value: ConditionComparator.STARTS,
            },
            Values: ['Sender1'],
        },
        {
            Type: {
                label: 'Sender',
                value: ConditionType.SENDER,
            },
            Comparator: {
                label: 'does not end with',
                value: ConditionComparator.DOES_NOT_END,
            },
            Values: ['Sender2'],
        },
        {
            Type: {
                label: 'Attachments',
                value: ConditionType.ATTACHMENTS,
            },
            Comparator: {
                label: 'does not contain',
                value: ConditionComparator.DOES_NOT_CONTAIN,
            },
            Values: [],
        },
    ],
    Actions: {
        FileInto: [
            'panda qwe qwe qwe qweqwe qw e',
            'panda3',
            'cool',
            'panda2',
            'test',
            'very long label wowowowowowowowowowowowoowowowwo',
            'wqeqweqweqweqweqweqweqweqweqweqweqweqweqweqwe',
            'archive',
        ],
        Mark: {
            Read: true,
            Starred: false,
        },
    },
};

export default { tree, simple };
