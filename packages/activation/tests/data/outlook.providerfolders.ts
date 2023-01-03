const data = [
    {
        Source: 'Inbox',
        Separator: '/',
        Flags: [],
        DestinationFolder: 'Inbox',
    },
    {
        Source: 'Sent Items',
        Separator: '/',
        Flags: [],
        DestinationFolder: 'Sent',
    },
    {
        Source: 'Drafts',
        Separator: '/',
        Flags: [],
        DestinationFolder: 'Drafts',
    },
    {
        Source: 'Archive',
        Separator: '/',
        Flags: [],
        DestinationFolder: 'Archive',
    },
    {
        Source: 'a really long folder name which should fail in this situation dsude because the name is really really really really long no ? what do you think ? I think it fails',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'A test folder',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'A test folder/A test subfolder',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'A test folder/sub folder',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'A test folder/sub folder/sub sub folder',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'A test folder/sub folder/sub sub folder/sub sub sub folder should be 2 lvl deep only',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'child folder with system folder name should be ok',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'child folder with system folder name should be ok/INBOX',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'just/slashes',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'just\\backslashes',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'Scheduled',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'slashe/backslash\\etvoila',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'slashes////backslashes\\\\\\\\etvoila',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'test slashes/in/name/then\\backslashes/the backslash and slash\\/dude',
        Separator: '/',
        Flags: [],
    },
    {
        Source: 'test slashes/in/name/then\\backslashes/the backslash and slash\\/dude/subfolder/with/\\slashes:é&êspecial=)characters',
        Separator: '/',
        Flags: [],
    },
];

export default data;
