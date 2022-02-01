import { rest } from 'msw';
import { addressBuilder, calendarBuilder, calendarEventBuilder, userBuilder } from './builders';

export const handlers = [
    rest.get('/addresses', (req, res, ctx) => {
        return res(
            ctx.json({
                Addresses: [addressBuilder()],
                Total: 1,
            })
        );
    }),
    rest.get(`/calendar/v1/:calendarId/events/:eventId`, (req, res, ctx) => {
        return res(
            ctx.json({
                Event: calendarEventBuilder(),
            })
        );
    }),
    rest.get(`/calendar/v1`, (req, res, ctx) => {
        return res(
            ctx.json({
                Calendars: [calendarBuilder()],
            })
        );
    }),
    rest.get(`/calendar/v1/events`, (req, res, ctx) => {
        return res(
            ctx.json({
                Events: [],
            })
        );
    }),
    rest.get(`/users`, (req, res, ctx) => {
        return res(
            ctx.json({
                User: userBuilder(),
            })
        );
    }),
    rest.get(`/settings/calendar`, (req, res, ctx) => {
        return res(
            ctx.json({
                CalendarUserSettings: {
                    WeekStart: 1,
                    WeekLength: 0,
                    DisplayWeekNumber: 1,
                    DateFormat: 0,
                    TimeFormat: 0,
                    AutoDetectPrimaryTimezone: 1,
                    PrimaryTimezone: 'Europe/Zurich',
                    DisplaySecondaryTimezone: 0,
                    SecondaryTimezone: null,
                    ViewPreference: 1,
                    DefaultCalendarID:
                        '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                    ShowCancelled: 1,
                    ShowDeclined: 1,
                    AutoImportInvite: 0,
                },
            })
        );
    }),
    rest.get(`/contacts/v4/contacts/emails`, (req, res, ctx) => {
        return res(
            ctx.json({
                ContactEmails: [],
            })
        );
    }),
    rest.get(`/calendar/v1/:calendarId/bootstrap`, (req, res, ctx) => {
        return res(
            ctx.json({
                Keys: [
                    {
                        ID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                        PrivateKey:
                            '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: ProtonMail\n\nxYYEYZYvsxYJKwYBBAHaRw8BAQdA5OCfLNgBD9N1o+rbYZ+T0cebDmXdqID9\nztWaA1Ks6g/+CQMIW87X8JxZQJZgbrTx1CiT3KHTzu6OPHyodLoBFTHsxuUk\nSH/QffB34h5ZcqBwjKXMXAxSUvSYoq3hA3SDpHWiYvpzVrXQGQPn6Z7nCvyu\njM0MQ2FsZW5kYXIga2V5wo8EEBYKACAFAmGWL7MGCwkHCAMCBBUICgIEFgIB\nAAIZAQIbAwIeAQAhCRA5ciVSKZC25RYhBKVX9ChVLEMtyLclAzlyJVIpkLbl\nVB0A/3EAxSlLsbwwcB1FdygYmNpUNcIA1F2a3jq0HFEY1M0dAP0eoUy/wI7G\n9dPWOdfIhsLpS8LZsnnlxXQCevonOi7xAceLBGGWL7MSCisGAQQBl1UBBQEB\nB0AYjNLjQgjzxU8rqfjXfiv/hIDBztnCHIHNC8bhHSMsWwMBCAf+CQMIccKl\n/DITNo5gvvFNaFhF6sKRd5KeOs7BPd/J1FZfmaEK5RF/o524eofdq7I3xp3F\nRTDmQ9XGKe237ixzBuX/Dlmb0BDAIXifTe9F23HQO8J4BBgWCAAJBQJhli+z\nAhsMACEJEDlyJVIpkLblFiEEpVf0KFUsQy3ItyUDOXIlUimQtuX8gQEA4xUQ\n4wbiOtsy+wimRQAzG3W5XWbpxcOdAhNWgen1EFIBANqbYe0rHPzfs6Jya6II\nXLLT5roLSphpuYwODd+GQ3kL\n=YRWm\n-----END PGP PRIVATE KEY BLOCK-----\n',
                        PassphraseID:
                            '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                        Flags: 3,
                        CalendarID:
                            '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                    },
                ],
                Passphrase: {
                    Flags: 1,
                    ID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                    MemberPassphrases: [
                        {
                            MemberID:
                                '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                            Passphrase:
                                '-----BEGIN PGP MESSAGE-----\nVersion: ProtonMail\n\nwV4DclxUAN87lmsSAQdAo9FgKmAgiR5vwuLn1O5Ms1RFNPR9Z3H5UMtk0A7q\nrFUwIIX6blb/51oAAi2T7Arp++gx/S+EUr0T1keB2wYMansZsYclQbXfix6s\nnWrxoejL0mQBV6qx9TtuDAvOFIEy0EXEsY2QKg8QjAsz01siPoYLXOV3xJm6\nwD8U72xxxxvoMtIsx5OmmQYDzqpFTasZCgGJxsCo/y/tI+089KPjjC1YRHKG\ng6uJr+BnQrv7vsi65+AjRgmW\n=znTY\n-----END PGP MESSAGE-----\n',
                            Signature:
                                '-----BEGIN PGP SIGNATURE-----\nVersion: ProtonMail\n\nwnUEARYKAAYFAmGWL+8AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\n7ts+MialAQCWwcs4GNahH4ZwGLxoQ5zpFCcieySg9sg1fYoSJXdYLAEApOc2\nxmZLBSMdpd4QrfWp2IhIyro6bO4s6NFRhElLmAw=\n=n64B\n-----END PGP SIGNATURE-----\n',
                        },
                    ],
                    CalendarID:
                        '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                },
                Members: [
                    {
                        ID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                        Permissions: 127,
                        Email: 'stest1@proton.black',
                        AddressID:
                            'Lw5suur9q0eTrcp-ufF41Ar7WNj5FQQFz_iKVcCD8khv0eVLJ8MPyx9oiI1XfZJ3JVuTmpG2dgOIY2zCCrIVIw==',
                        CalendarID:
                            '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                        Color: '#5EC7B7',
                        Display: 1,
                    },
                ],
                CalendarSettings: {
                    ID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                    CalendarID:
                        '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
                    DefaultEventDuration: 30,
                    DefaultPartDayNotifications: [
                        {
                            Type: 1,
                            Trigger: '-PT15M',
                        },
                    ],
                    DefaultFullDayNotifications: [
                        {
                            Type: 1,
                            Trigger: '-PT15H',
                        },
                    ],
                },
            })
        );
    }),
    rest.get(`/mail/v4/settings`, (req, res, ctx) => {
        return res(
            ctx.json({
                MailSettings: {
                    LastLoginTime: 0,
                    AutoSaveContacts: 1,
                    AutoWildcardSearch: 1,
                    ComposerMode: 0,
                    FontSize: null,
                    FontFace: null,
                    MessageButtons: 0,
                    ShowImages: 2,
                    ShowMoved: 0,
                    ViewMode: 0,
                    ViewLayout: 0,
                    SwipeLeft: 3,
                    SwipeRight: 0,
                    AlsoArchive: 0,
                    Hotkeys: 0,
                    Shortcuts: 1,
                    PMSignature: 0,
                    ImageProxy: 0,
                    TLS: 0,
                    RightToLeft: 0,
                    AttachPublicKey: 0,
                    Sign: 0,
                    PGPScheme: 16,
                    PromptPin: 0,
                    KT: 0,
                    Autocrypt: 0,
                    StickyLabels: 0,
                    ExpandFolders: 0,
                    ConfirmLink: 1,
                    DelaySendSeconds: 10,
                    ThemeType: 0,
                    ThemeVersion: null,
                    Theme: '',
                    DisplayName: '',
                    Signature: '',
                    AutoResponder: {
                        StartTime: 0,
                        EndTime: 0,
                        DaysSelected: [],
                        Repeat: 0,
                        Subject: 'Auto',
                        Message: '',
                        IsEnabled: false,
                        Zone: 'Europe/Zurich',
                    },
                    EnableFolderColor: 0,
                    InheritParentFolderColor: 1,
                    NumMessagePerPage: 50,
                    RecipientLimit: 100,
                    DraftMIMEType: 'text/html',
                    ReceiveMIMEType: 'text/html',
                    ShowMIMEType: 'text/html',
                },
            })
        );
    }),
];
