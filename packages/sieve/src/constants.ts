export const V1 = 1;
export const V2 = 2;

export const TEST_NODES = {
    spamtest: [
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
    ],
    attachment: [
        {
            Headers: ['X-Attached'],
            Type: 'Exists',
        },
    ],
    dollar: [
        {
            Name: 'dollar',
            Value: '$',
            Flags: [],
            Type: 'Set',
        },
    ],
};
