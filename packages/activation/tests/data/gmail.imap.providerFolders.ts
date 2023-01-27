const gmailImapModalLabels = [
    {
        Source: 'INBOX',
        Separator: '/',
        Flags: ['HasNoChildren'],
        DestinationFolder: 'Inbox',
    },
    {
        Source: '[Gmail]/Sent Mail',
        Separator: '/',
        Flags: ['HasNoChildren', 'Sent'],
        DestinationFolder: 'Sent',
    },
    {
        Source: '[Gmail]/Drafts',
        Separator: '/',
        Flags: ['Drafts', 'HasNoChildren'],
        DestinationFolder: 'Drafts',
    },
    {
        Source: '[Gmail]/Starred',
        Separator: '/',
        Flags: ['Flagged', 'HasNoChildren'],
        DestinationFolder: 'Starred',
    },
    {
        Source: '[Gmail]/All Mail',
        Separator: '/',
        Flags: ['All', 'HasNoChildren'],
        DestinationFolder: 'All Mail',
    },
    {
        Source: 'Important',
        Separator: '/',
        Flags: ['HasChildren'],
    },
];
export default gmailImapModalLabels;
