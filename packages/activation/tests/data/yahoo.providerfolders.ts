const data = [
    {
        Source: 'Inbox',
        Separator: '/',
        Flags: ['HasNoChildren'],
        DestinationFolder: 'Inbox',
    },
    {
        Source: 'Sent',
        Separator: '/',
        Flags: ['Sent', 'HasNoChildren'],
        DestinationFolder: 'Sent',
    },
    {
        Source: 'Draft',
        Separator: '/',
        Flags: ['Drafts', 'HasNoChildren'],
        DestinationFolder: 'Drafts',
    },
    {
        Source: 'Archive',
        Separator: '/',
        Flags: ['Archive', 'HasNoChildren'],
        DestinationFolder: 'Archive',
    },
    {
        Source: 'another test foldr with a really long name hey hye hey',
        Separator: '/',
        Flags: ['HasNoChildren'],
    },
    {
        Source: "Spéciæl charaters-&'(yeah",
        Separator: '/',
        Flags: ['HasChildren'],
    },
    {
        Source: "Spéciæl charaters-&'(yeah/sub spécïªl charaters",
        Separator: '/',
        Flags: ['HasNoChildren'],
    },
    {
        Source: 'Test folder',
        Separator: '/',
        Flags: ['HasChildren'],
    },
    {
        Source: 'Test folder/a test folder with big name',
        Separator: '/',
        Flags: ['HasChildren'],
    },
    {
        Source: 'Test folder/a test folder with big name/a sub sub folder',
        Separator: '/',
        Flags: ['HasNoChildren'],
    },
];

export default data;
