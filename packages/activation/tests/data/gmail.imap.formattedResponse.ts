export const gmailImapResponse = {
    ImporterID: 'importerID',
    Mail: {
        AddressID: 'ID',
        Mapping: [
            {
                Source: 'INBOX',
                Destinations: { FolderPath: 'Inbox' },
                checked: true,
            },
            {
                Source: '[Gmail]/Sent Mail',
                Destinations: { FolderPath: 'Sent' },
                checked: true,
            },
            {
                Source: '[Gmail]/Drafts',
                Destinations: { FolderPath: 'Drafts' },
                checked: true,
            },
            {
                Source: '[Gmail]/Starred',
                Destinations: { FolderPath: 'Starred' },
                checked: true,
            },
            {
                Source: '[Gmail]/All Mail',
                Destinations: { FolderPath: 'All Mail' },
                checked: true,
            },
            {
                Source: 'Important',
                Destinations: {
                    Labels: [
                        {
                            Name: 'Important',
                            Color: '#8080FF',
                        },
                    ],
                },
                checked: true,
            },
        ],
        Code: 'password',
        CustomFields: 7,
        ImportLabel: {
            Color: '#fff',
            Name: 'label',
            Type: 1,
        },
    },
};
