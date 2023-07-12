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
        List: ['fileinto', 'imap4flags', 'vacation'],
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
        Name: 'dollar',
        Value: '$',
        Flags: [],
        Type: 'Set',
    },
    {
        Text: '/**\r\n * @type or\r\n * @comparator ends\r\n */',
        Type: 'Comment',
    },
    {
        If: {
            Tests: [
                {
                    Headers: ['To', 'Cc', 'Bcc'],
                    Keys: [
                        {
                            Type: 'VariableString',
                            Value: '*${dollar}{frommail}',
                        },
                        '*${}',
                        {
                            Type: 'VariableString',
                            Value: '*${dollar}{frommail} ${dollar}{tomail}',
                        },
                    ],
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
            ],
            Type: 'AnyOf',
        },
        Then: [
            {
                Name: 'archive',
                Type: 'FileInto',
            },
            {
                Name: 'polo',
                Type: 'FileInto',
            },
            {
                Name: {
                    Value: '${dollar}{File}',
                    Type: 'VariableString',
                },
                Type: 'FileInto',
            },
            {
                Flags: ['\\Seen', '\\Flagged'],
                Type: 'AddFlag',
            },
            {
                Type: 'Keep',
            },
            {
                Message: {
                    Value: "<div>Je mange une pomme, ${dollar}{d3_so} pas ${déso} mais ${j'ai} faim pedro</div> ",
                    Type: 'VariableString',
                },
                Args: {
                    MIMEType: 'text/html',
                },
                Type: 'Vacation',
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
                label: 'Recipient',
                value: ConditionType.RECIPIENT,
            },
            Comparator: {
                label: 'ends with',
                value: ConditionComparator.ENDS,
            },
            Values: ['${frommail}', '${}', '${frommail} ${tomail}'],
        },
    ],
    Actions: {
        FileInto: ['archive', 'polo', '${File}'],
        Mark: {
            Read: true,
            Starred: true,
        },
        Vacation: "<div>Je mange une pomme, ${d3_so} pas ${déso} mais ${j'ai} faim pedro</div> ",
    },
};

export default { tree, simple };
