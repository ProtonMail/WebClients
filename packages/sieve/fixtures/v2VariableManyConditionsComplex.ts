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
        Name: 'frommail',
        Value: 'xxx@pm.me',
        Flags: [],
        Type: 'Set',
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
        Text: '/**\r\n * @type or\r\n * @comparator contains\r\n * @comparator contains\r\n * @comparator default\r\n * @comparator is\r\n */',
        Type: 'Comment',
    },
    {
        If: {
            Tests: [
                {
                    Headers: ['Subject'],
                    Keys: ['jeanne', '/monique\\d+/'],
                    Match: {
                        Type: 'Contains',
                    },
                    Format: {
                        Type: 'UnicodeCaseMap',
                    },
                    Type: 'Header',
                },
                {
                    Headers: ['From'],
                    Keys: ['protonmail'],
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
                {
                    Headers: ['X-Attached'],
                    Type: 'Exists',
                },
                {
                    Headers: ['To', 'Cc', 'Bcc'],
                    Keys: [
                        {
                            Value: '${frommail}',
                            Type: 'VariableString',
                        },
                    ],
                    Match: {
                        Type: 'Is',
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
                Flags: ['\\Seen', '\\Flagged'],
                Type: 'AddFlag',
            },
            {
                Type: 'Keep',
            },
            {
                Message: "<div>Je mange une pomme, déso pas déso mais j'ai faim pedro</div> ",
                Args: {
                    MIMEType: 'text/html',
                },
                Type: 'Vacation',
            },
        ],
        Type: 'If',
    },
];

export default { tree, simple: undefined };
