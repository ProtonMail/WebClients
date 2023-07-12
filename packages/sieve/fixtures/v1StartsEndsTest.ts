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
                    Keys: ['starts with*'],
                    Match: {
                        Type: 'Matches',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    Type: 'Header',
                },
                {
                    Test: {
                        Headers: ['Subject'],
                        Keys: ['*ends with'],
                        Match: {
                            Type: 'Matches',
                        },
                        Format: {
                            Type: 'UnicodeCaseMap',
                        },
                        Type: 'Header',
                    },
                    Type: 'Not',
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
            Values: ['starts with*'],
            Type: {
                label: 'Subject',
                value: ConditionType.SUBJECT,
            },
            Comparator: {
                label: 'matches',
                value: ConditionComparator.MATCHES,
            },
        },
        {
            Values: ['*ends with'],
            Type: {
                label: 'Subject',
                value: ConditionType.SUBJECT,
            },
            Comparator: {
                label: 'does not match',
                value: ConditionComparator.DOES_NOT_MATCH,
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
