import { HttpResponse, http } from 'msw';

import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { addressBuilder, calendarBuilder, calendarEventBuilder, userBuilder } from './builders';

export const getHandlers = () => [
    http.get('/addresses', () => {
        return HttpResponse.json({
            Addresses: [addressBuilder()],
            Total: 1,
        });
    }),
    http.get(`/calendar/v1/:calendarId/events/:eventId`, () => {
        return HttpResponse.json({
            Event: calendarEventBuilder(),
        });
    }),
    http.get(`/calendar/v1`, () => {
        return HttpResponse.json({
            Calendars: [calendarBuilder()],
        });
    }),
    http.get(`/calendar/v1/events`, () => {
        return HttpResponse.json({
            Events: [],
        });
    }),
    http.get(`/users`, () => {
        return HttpResponse.json({
            User: userBuilder(),
        });
    }),
    http.get(`/settings/calendar`, () => {
        return HttpResponse.json({
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
        });
    }),
    http.get(`/contacts/v4/contacts/emails`, () => {
        return HttpResponse.json({
            ContactEmails: [],
        });
    }),
    http.get(`/calendar/v1/:calendarId/bootstrap`, () => {
        return HttpResponse.json({
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
                CalendarID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
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
                CalendarID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
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
        });
    }),
    http.get(`/mail/v4/settings`, () => {
        return HttpResponse.json({
            MailSettings: DEFAULT_MAIL_SETTINGS,
        });
    }),
];
