import { build } from '@jackfranklin/test-data-bot';

import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Address, AddressKey } from '@proton/shared/lib/interfaces';
import { CalendarEventWithMetadata, VcalVeventComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

export const messageBuilder = build<Pick<Message, 'ID' | 'ParsedHeaders'>>('Message', {
    fields: {
        ID: 'FbqL-2iaaLZnVB8oF3PI5hUQW6nbggQ_tg7n0xZlhAw59jy7WXaZbMh51ESNQY16Tq0OKxHu4PvKlux2sXAU8w==',
        ParsedHeaders: {
            To: 'stest1@proton.black',
            From: 'ProtonCalendar <noreply@proton.black>',
            Date: 'Thu, 25 Nov 2021 16:16:15 +0000',
            Subject: 'Reminder: event starting at 6:00 PM (GMT+1) on Thursday, November 25',
            'X-Auto-Response-Suppress': 'OOF',
            Precedence: 'bulk',
            'Auto-Submitted': 'auto-generated',
            References:
                '<jWX4uC1V6Nib4EHf19aHN3bC7K5HRChaFBzBZSOrCkE7Dlx0LX0tQqw89Stl45PZXvpJ5hH_BUcpB_Ms3UUIeQ==@calendar.proton.me>',
            'X-Pm-Calendar-Eventid':
                'jWX4uC1V6Nib4EHf19aHN3bC7K5HRChaFBzBZSOrCkE7Dlx0LX0tQqw89Stl45PZXvpJ5hH_BUcpB_Ms3UUIeQ==',
            'X-Pm-Calendar-Calendarid':
                '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
            'X-Pm-Calendar-Occurrence': '1637859600',
            'X-Pm-Calendar-Sequence': '0',
            'X-Pm-Calendar-Eventuid': 'Ei1MAms3nRIcvGqJ3S7o-UUCkL7i@proton.me',
            'X-Pm-Calendar-Eventisrecurring': '0',
            'Message-Id': '<026FBWBHHV3J86BEWD000VNHR0@protonmail.com>',
            'X-Pm-Origin': 'internal',
            'X-Pm-Content-Encryption': 'end-to-end',
            'X-Pm-Spamscore': '0',
            Received: 'from mailmx.proton.black by mailmx.proton.black; Thu, 25 Nov 2021 16:16:36 +0000',
            'X-Original-To': 'stest1@proton.black',
            'Return-Path': '<noreply@proton.black>',
            'Delivered-To': 'stest1@proton.black',
            'Mime-Version': '1.0',
            'Content-Type': 'text/html',
            'X-Attached': 'protoncalendar.png',
        },
    },
});

const testEmail = 'stest1@proton.black';
const testAdddressId = 'Lw5suur9q0eTrcp-ufF41Ar7WNj5FQQFz_iKVcCD8khv0eVLJ8MPyx9oiI1XfZJ3JVuTmpG2dgOIY2zCCrIVIw==';
const testCalendarId = '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==';

export const calendarBuilder = build<VisualCalendar>('Calendar', {
    fields: {
        ID: testCalendarId,
        Name: 'My calendar',
        Description: '',
        Type: 0,
        Flags: CALENDAR_FLAGS.ACTIVE,
        Email: testEmail,
        Color: '#F00',
        Display: 1,
        Permissions: 127,
        Owner: { Email: testEmail },
        Members: [
            {
                ID: 'otkpEZzG--8dMXvwyLXLQWB72hhBhNGzINjH14rUDfywvOyeN01cDxDrS3Koifxf6asA7Xcwtldm0r_MCmWiAQ==',
                Email: testEmail,
                Permissions: 127,
                AddressID: testAdddressId,
                Flags: CALENDAR_FLAGS.ACTIVE,
                Color: '#F00',
                Display: 1,
                CalendarID: testCalendarId,
                Name: 'My calendar',
                Description: '',
            },
        ],
    },
    traits: {
        resetNeeded: {
            overrides: {
                Members: [
                    {
                        ID: 'otkpEZzG--8dMXvwyLXLQWB72hhBhNGzINjH14rUDfywvOyeN01cDxDrS3Koifxf6asA7Xcwtldm0r_MCmWiAQ==',
                        Email: testEmail,
                        Permissions: 127,
                        AddressID: testAdddressId,
                        Flags: CALENDAR_FLAGS.RESET_NEEDED,
                        Color: '#F00',
                        Display: 1,
                        CalendarID: testCalendarId,
                        Name: 'My calendar',
                        Description: '',
                    },
                ],
            },
        },
        updatePassphrase: {
            overrides: {
                Members: [
                    {
                        ID: 'otkpEZzG--8dMXvwyLXLQWB72hhBhNGzINjH14rUDfywvOyeN01cDxDrS3Koifxf6asA7Xcwtldm0r_MCmWiAQ==',
                        Email: testEmail,
                        Permissions: 127,
                        AddressID: testAdddressId,
                        Flags: CALENDAR_FLAGS.UPDATE_PASSPHRASE,
                        Color: '#F00',
                        Display: 1,
                        CalendarID: testCalendarId,
                        Name: 'My calendar',
                        Description: '',
                    },
                ],
            },
        },
    },
});

export const addressKeyBuilder = build<AddressKey>('AddressKey', {
    fields: {
        ID: 'oAwF7m8z5CksIPpX9fzAGp6hvyy0zPV0XnDWkdq-OcPyBmVygc7cyK-JFgr_HVkOc4B48BM-RSNILvPDZyfOGA==',
        Flags: 3,
        Primary: 1,
        Fingerprint: 'dbae8b8bb94db1b8cce9d7d2d683831eeedb3e32',
        Fingerprints: ['1be0b1b19ca7cc803eba2234725c5400df3b966b', 'dbae8b8bb94db1b8cce9d7d2d683831eeedb3e32'],
        PublicKey:
            '-----BEGIN PGP PUBLIC KEY BLOCK-----\\nVersion: ProtonMail\\n\\nxjMEYZYvQxYJKwYBBAHaRw8BAQdA7QXbKv40LALRWxAhKs5qdXCugnfV+ltz\\ndRMIzvLza/XNKXN0ZXN0MUBwcm90b24uYmxhY2sgPHN0ZXN0MUBwcm90b24u\\nYmxhY2s+wo8EEBYKACAFAmGWL0MGCwkHCAMCBBUICgIEFgIBAAIZAQIbAwIe\\nAQAhCRDWg4Me7ts+MhYhBNuui4u5TbG4zOnX0taDgx7u2z4yPJYA/ihS6mAn\\ndgU9SWuT2eQdpHzjS2aFM++3ORBqbmlUMJ2TAP9BK/ShGaU1xQT7oW4r1IwJ\\nwh6GPVoI9l/dDluwAsgbDM44BGGWL0MSCisGAQQBl1UBBQEBB0BHSIm4e1GL\\ndcT1fSo1xyPDskA8DQ3xzgECfLiGB0G/ZwMBCAfCeAQYFggACQUCYZYvQwIb\\nDAAhCRDWg4Me7ts+MhYhBNuui4u5TbG4zOnX0taDgx7u2z4yvkEBAMUxhmbz\\n/iKUMCB1dZWWYgXxXubgRXVE6KUB14tbQS+IAP98S0YWeQgOXG5tRzOgxpZL\\n9hyxyxotRbZCxiMfLIJeBw==\\n=LacE\\n-----END PGP PUBLIC KEY BLOCK-----\\n',
        PrivateKey:
            '-----BEGIN PGP PRIVATE KEY BLOCK-----\\nVersion: ProtonMail\\n\\nxYYEYZYvQxYJKwYBBAHaRw8BAQdA7QXbKv40LALRWxAhKs5qdXCugnfV+ltz\\ndRMIzvLza/X+CQMI91KskzNcMxhgYjWul/wQozuyfoGySCt3I81VyUgQn2qd\\nwRtolOfoecu6KeOm+62vHBxwUDqeU0RQ3d40gEdf/iqQqSB8PCLSRoU8i4zP\\nhM0pc3Rlc3QxQHByb3Rvbi5ibGFjayA8c3Rlc3QxQHByb3Rvbi5ibGFjaz7C\\njwQQFgoAIAUCYZYvQwYLCQcIAwIEFQgKAgQWAgEAAhkBAhsDAh4BACEJENaD\\ngx7u2z4yFiEE266Li7lNsbjM6dfS1oODHu7bPjI8lgD+KFLqYCd2BT1Ja5PZ\\n5B2kfONLZoUz77c5EGpuaVQwnZMA/0Er9KEZpTXFBPuhbivUjAnCHoY9Wgj2\\nX90OW7ACyBsMx4sEYZYvQxIKKwYBBAGXVQEFAQEHQEdIibh7UYt1xPV9KjXH\\nI8OyQDwNDfHOAQJ8uIYHQb9nAwEIB/4JAwgS0zzsR9GuWWApVtJXYfWFaVy+\\nWv8RtclDDWvYCXm7U6t9Z4X74cYVJdCxxieoOqOs9xiZuWbGUVaj10z2o5WP\\nqp5tfpPMwxgBNNbX7CASwngEGBYIAAkFAmGWL0MCGwwAIQkQ1oODHu7bPjIW\\nIQTbrouLuU2xuMzp19LWg4Me7ts+Mr5BAQDFMYZm8/4ilDAgdXWVlmIF8V7m\\n4EV1ROilAdeLW0EviAD/fEtGFnkIDlxubUczoMaWS/YcscsaLUW2QsYjHyyC\\nXgc=\\n=wxep\\n-----END PGP PRIVATE KEY BLOCK-----\\n',
        Signature:
            '-----BEGIN PGP SIGNATURE-----\\nVersion: ProtonMail\\n\\nwnUEARYKAAYFAmGWL38AIQkQmMokddP43uoWIQSeQbXypkkMBCLPiL+YyiR1\\n0/je6t0xAPsE4JQeK2gIug3FLP/FGERdmwcscuZNgaoCpUqQupp5eAD/QtOs\\nBF243mQGEbji7T8cq/E5AP7a/nNa4uWvNPAI/gk=\\n=Icvl\\n-----END PGP SIGNATURE-----\\n',
        Token: '-----BEGIN PGP MESSAGE-----\\nVersion: ProtonMail\\n\\nwV4Dq7i1ziRJQLUSAQdAe+uk39M57AL4pw8jNszfIQ9iOIrYD0qROCVBsttu\\naR8wZ2NmkCujcl4ruaPEDp4cOEE/CAh1aU49zsXVkG/mv5+fd+Y7RWUqoNjI\\n/Y+mUyhM0ngBHu51pNAOaOVphTTZXlCkJmhM2wdggQaIbR6yR4KcFyvycgHj\\nFqdgJKhEwocDW9AtLxcbcPWYXQucB5Gfa4omMS966uKigF5EfeDimK+sQ7mF\\nL3/XKOvRy7axwptQDdGN1/MeloLEQIUdeo+n8FF5IOCZ+7N/YMg=\\n=0UNR\\n-----END PGP MESSAGE-----\\n',
        RecoverySecret: null,
        RecoverySecretSignature: null,
        Active: 1,
        Version: 3,
    },
});

export const addressBuilder = build<Address>('Address', {
    fields: {
        ID: testAdddressId,
        DomainID: 'l8vWAXHBQmv0u7OVtPbcqMa4iwQaBqowINSQjPrxAr-Da8fVPKUkUcqAq30_BCxj1X0nW70HQRmAa-rIvzmKUA==',
        DisplayName: testEmail,
        Email: testEmail,
        Keys: [],
        HasKeys: 1,
        SignedKeyList: {
            MinEpochID: null,
            MaxEpochID: null,
            Data: '[{"Primary":1,"Flags":3,"Fingerprint":"dbae8b8bb94db1b8cce9d7d2d683831eeedb3e32","SHA256Fingerprints":["41964058156a2d90c1f0e65a38f5752fb2921b9666ea3b17f781787b6ef55f8f","d82271d5deec94e65862ca759f3c24a263512f00bf67864cac71c8b14f0dc744"]}]',
            Signature:
                '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwnUEARYKAAYFAmGWL38AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\r\n7ts+MmKdAQDGpH8FevWQE32waPgqx+1EqjGmEdywZdZkilUEwb0VswEAgdrS\r\noustAwFTu4E5PubZz7H7tN0SqM9p5GiKSYJSCQg=\r\n=gK8A\r\n-----END PGP SIGNATURE-----\r\n',
        },
        Order: 1,
        Priority: 1,
        Receive: 1,
        Send: 1,
        Signature: '',
        Status: 1,
        Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    },
    postBuild: (address) => {
        address.Keys = [addressKeyBuilder()];

        return address;
    },
});

export const calendarEventBuilder = build<CalendarEventWithMetadata>('Event', {
    fields: {
        IsProtonProtonInvite: 0,
        // LastEditTime: 1637857503,
        Author: 'stest1@proton.black',
        Permissions: 1,
        SharedKeyPacket:
            'wV4Dg2X1eF86wkcSAQdADLyc34k1EjC67CQo4M2OuhmX+YwNKQhbk6bz2ow31kgw2oiUfClVOBP5sYPcIJ+aD1B9JrTrDP5gY/BUiXKMPpEbaZpp+5DKBKIpdLheM5cJ',
        SharedEvents: [
            {
                Type: 2,
                Data: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:Ei1MAms3nRIcvGqJ3S7o-UUCkL7i@proton.me\r\nDTSTAMP:20211125T162445Z\r\nDTSTART;TZID=Europe/Zurich:20211125T180000\r\nDTEND;TZID=Europe/Zurich:20211125T193000\r\nORGANIZER;CN=stest1@proton.black:mailto:stest1@proton.black\r\nSEQUENCE:0\r\nEND:VEVENT\r\nEND:VCALENDAR',
                Signature:
                    '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwnUEARYKAAYFAmGfuN0AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\r\n7ts+MpTvAP41Z15ymzb+mGakFzAMui23FzRSF0gNHEqRgPGYDNTsXQD9Hrh+\r\nNC4mIQG3mhgx5gKzDSR7yRv7shr9TPVZUe/GuAA=\r\n=yrvm\r\n-----END PGP SIGNATURE-----\r\n',
                Author: 'stest1@proton.black',
            },
            {
                Type: 3,
                Data: '0sBOAVp6l7BAqo8QhcuhlZIrWPYtPYWub5bFf+FTQc6sqz0EtozOUpO4+Ki/3S5YID5xhCkj/TyjA3CP+1TIs5giO2yvRD6GZ/TLPa9XXKmVWBYA+Y+otvAbT0sOudh7T3e2jdhQFcdUHYWoskF5nltoX54AdZuqijT/CBlmfwkIlu9Nv8S/ovW3Wna9BqhYE+XFV9F4ILEz+WicixqbUtsQR8IO1y0wwD9LC7fy07Nd96ym5XB7lEc5d1NfhXiB+dJQ1TXSHcMbgHkt4upOESFGHpXzOKjKDYji75IqzTWErcAgvCHz8aRrYSmaQ2Iz0PtOh83zfNoWwRzj0+OpFLF1EOywrloQdrqmAQ1V2sYo',
                Signature:
                    '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwnUEARYKAAYFAmGfuN0AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\r\n7ts+Mt7nAQCGtqatUfwfDhYOCFVu3DEYtEtJBsPG1kSGibzBit3++wD/Vgz8\r\n+Oh4n5pCt1lKVXArEWcGP5LESUAfvtoV4zdevgA=\r\n=4wfE\r\n-----END PGP SIGNATURE-----\r\n',
                Author: 'stest1@proton.black',
            },
        ],
        CalendarKeyPacket: null,
        AddressKeyPacket: null,
        AddressID: null,
        CalendarEvents: [
            {
                Type: 2,
                Data: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:Ei1MAms3nRIcvGqJ3S7o-UUCkL7i@proton.me\r\nDTSTAMP:20211125T162445Z\r\nSTATUS:CONFIRMED\r\nEND:VEVENT\r\nEND:VCALENDAR',
                Signature:
                    '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwnUEARYKAAYFAmGfuN0AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\r\n7ts+Mi8UAQC4VMeBVVzERqdjviLIQHoqQFrRK569/uqokDCBXuZmYwEA6oNl\r\nX3laSh9+ZYhjWZ+KMydEBDQzsuT9+l7bDqJi4AA=\r\n=4H4p\r\n-----END PGP SIGNATURE-----\r\n',
                Author: 'stest1@proton.black',
            },
        ],
        ID: 'jWX4uC1V6Nib4EHf19aHN3bC7K5HRChaFBzBZSOrCkE7Dlx0LX0tQqw89Stl45PZXvpJ5hH_BUcpB_Ms3UUIeQ==',
        CalendarID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
        SharedEventID:
            '3YnKxnpRu1eDKP2_WkwZF54MlQSYHvl1FZKFgeiHrjaa4ff60s0yTYlXBMaUUApx1wxaRStoe-c-07JmOp8giBLZe_byc8u_dCWjQGf1zxw=',
        StartTime: 1637859600,
        StartTimezone: 'Europe/Zurich',
        EndTime: 1637865000,
        EndTimezone: 'Europe/Zurich',
        FullDay: 0,
        UID: 'Ei1MAms3nRIcvGqJ3S7o-UUCkL7i@proton.me',
        RecurrenceID: null,
        Exdates: [],
        RRule: null,
        CreateTime: 1637855813,
        ModifyTime: 1637857503,
        IsOrganizer: 1,
        PersonalEvents: [
            {
                Type: 2,
                Data: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:Ei1MAms3nRIcvGqJ3S7o-UUCkL7i@proton.me\r\nDTSTAMP:20211125T162445Z\r\nBEGIN:VALARM\r\nTRIGGER:-PT60M\r\nACTION:EMAIL\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR',
                Signature:
                    '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwnUEARYKAAYFAmGfuN0AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\r\n7ts+MqoMAQDPn8EbAkjNTonQUG8GBY4nKYVAPzEOX+slwfqmWdqkrwEA+J3c\r\nJJOGtKi/MiXv5hJolxUxOP8YIAtg4cr8UqU+GQU=\r\n=/kOi\r\n-----END PGP SIGNATURE-----\r\n',
                Author: 'stest1@proton.black',
                MemberID: '8DqHHGgVZgEb9KJ0En3mhktAcUBNlAEfGdp5-KnBy2WedZq2Th_gBhphVfcSITxDpz914-LvghzmLf5dhOB5HQ==',
            },
        ],
        AttendeesEvents: [
            {
                Type: 3,
                Data: '0sEYAYJHqp1jBcWK88Dyn7KmmqYv87UfmOj0bFafht64OeqBKwHWbhNbjo8lRWg5st3hDXEiamCe2d2BfoNhU/EF9UEEb+8jfsvbNAgtYgZYwR29jK2viqw1VY6lZPBVERhXl8enicmMfEOUkOwwZjyOSEHeLMJd9paeba5VoHHRD2d4HApQnWx40FG1E91jbJXm/oCZRaObmb7UC8lXET4J2n/+Gk9NQz5azEWZ8AImVkLmrOKtOeWRVYaV+YFoVMn5hEAhYMSJ8rSjU3cOTk0ve9ALr0hWTnUhbs5yAvnvmWI270y3ipXbO56BGD/oKNogErgPEcCwY97Z1+zKKXEvNCK49Bvo3ltm+cszJAfUJNisdGZTkWT/Jl2BfvXm/bYFs+9p+WTFIGwMNk3K6YV5/65qz7VCElx940nsLfpyPBUT/GONRuYFdxyjpyKxNk65QH4dMfjBK2+y9F6mJ7Cn4iRVGLWBMMMC+yKdJA5fGaFAmoJprtWRjA8hwnjneBsZ98ZZqVClOw/8o2HOjdBjgf/0XmUnxGRc1eIkpo3tWiKdNzXGW7d3C7W4Rs/ludBb2BFnzzoMbY4saPJ2GobKXR1fSRvdtlX3dGgDHcsy5YQ2jroFD9lsIw==',
                Signature:
                    '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwnUEARYKAAYFAmGfuN0AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\r\n7ts+MrCDAP9WYG5b/GBu0mxUuOUViDU3YadrEBpi8Zu+jO9wlMTvbwD/W/68\r\n4Tod7E68Q9DIHInPb8bBJXDizBeo6Lbp8dVXfgM=\r\n=frBC\r\n-----END PGP SIGNATURE-----\r\n',
                Author: 'stest1@proton.black',
            },
        ],
        Attendees: [
            {
                ID: 'Proye_ciptkeikxsRdv3sVlYdqVXqRAJOfIjn_Bcug_9PaEDxga9-gHHa0Bkds25K3GBt50C4gJNsNexeirkrg==',
                Token: '3c5c89a60b8e36ff0b4b1399152b0551c73e373f',
                Status: 0,
                UpdateTime: null,
            },
            {
                ID: '_rJk4ub7qapyIkWd-d3EwIbJ7svqscEuq_HfWM_E6oBHEQAIKFFpx-89fW27J8waIU39_hcJQ34yM4p9GlYChQ==',
                Token: '5578255a302f0938e7f5628487a06ed0fd0f5c8c',
                Status: 0,
                UpdateTime: null,
            },
        ],
    },
    traits: {
        canceled: {
            overrides: {
                CalendarEvents: [
                    {
                        Type: 2,
                        Data: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:Ei1MAms3nRIcvGqJ3S7o-UUCkL7i@proton.me\r\nDTSTAMP:20211125T162445Z\r\nSTATUS:CANCELLED\r\nEND:VEVENT\r\nEND:VCALENDAR',
                        Signature:
                            '-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v4.10.10\r\nComment: https://openpgpjs.org\r\n\r\nwnUEARYKAAYFAmGfuN0AIQkQ1oODHu7bPjIWIQTbrouLuU2xuMzp19LWg4Me\r\n7ts+Mi8UAQC4VMeBVVzERqdjviLIQHoqQFrRK569/uqokDCBXuZmYwEA6oNl\r\nX3laSh9+ZYhjWZ+KMydEBDQzsuT9+l7bDqJi4AA=\r\n=4H4p\r\n-----END PGP SIGNATURE-----\r\n',
                        Author: 'stest1@proton.black',
                    },
                ],
            },
        },
    },
});

export const veventBuilder = build<VcalVeventComponent>('vevent', {
    fields: {
        component: 'vevent',
        uid: {
            value: 'Ei1MAms3nRIcvGqJ3S7o-UUCkL7i@proton.me',
        },
        dtstamp: {
            value: {
                year: 2021,
                month: 11,
                day: 25,
                hours: 16,
                minutes: 24,
                seconds: 45,
                isUTC: true,
            },
        },
        dtstart: {
            value: {
                year: 2021,
                month: 11,
                day: 25,
                hours: 18,
                minutes: 0,
                seconds: 0,
                isUTC: false,
            },
            parameters: {
                tzid: 'Europe/Zurich',
            },
        },
        dtend: {
            value: {
                year: 2021,
                month: 11,
                day: 25,
                hours: 19,
                minutes: 30,
                seconds: 0,
                isUTC: false,
            },
            parameters: {
                tzid: 'Europe/Zurich',
            },
        },
        organizer: {
            value: 'mailto:stest1@proton.black',
            parameters: {
                cn: 'stest1@proton.black',
            },
        },
        sequence: {
            value: 0,
        },
        description: {
            value: 'Test description',
        },
        summary: {
            value: 'Test event',
        },
        location: {
            value: 'Test location',
        },
        status: {
            value: 'CONFIRMED',
        },
        attendee: [
            {
                value: 'mailto:visionary@proton.black',
                parameters: {
                    cn: 'visionary@proton.black',
                    role: 'REQ-PARTICIPANT',
                    rsvp: 'TRUE',
                    'x-pm-token': '3c5c89a60b8e36ff0b4b1399152b0551c73e373f',
                    partstat: 'NEEDS-ACTION',
                },
            },
            {
                value: 'mailto:calendar@proton.black',
                parameters: {
                    cn: 'calendar@proton.black',
                    role: 'REQ-PARTICIPANT',
                    rsvp: 'TRUE',
                    'x-pm-token': '5578255a302f0938e7f5628487a06ed0fd0f5c8c',
                    partstat: 'NEEDS-ACTION',
                },
            },
        ],
    },
});

export const userBuilder = build('User', {
    fields: {
        ID: 'XTMQTRBEv-QushjfD5ST-YBFsGCWD-XwuRWoyqgWvPVQj5KcKQRy207GIwLK-DvBrRL-PAiIpp4XKoznVXq-HA==',
        Subscribed: 0, // 5 is visionary
        Name: 'stest1',
        UsedSpace: 729514,
        Currency: 'EUR',
        Credit: 0,
        MaxSpace: 21474836480,
        MaxUpload: 26214400,
        Services: 5,
        DriveEarlyAccess: 1,
        MnemonicStatus: 1,
        Role: 2,
        Private: 1,
        Delinquent: 0,
        Keys: [
            {
                ID: 'G069KcZLuBEqitlJvsNsldLWx4kR4HAMwkjLp8w7-VcjWpI0pKExAm0QwalWsoUGKoHrOp5lQSqDYi8nYzKZZA==',
                Version: 3,
                Primary: 1,
                RecoverySecret: null,
                RecoverySecretSignature: null,
                PrivateKey:
                    '-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: ProtonMail\n\nxYYEYZYvQxYJKwYBBAHaRw8BAQdAOAQ0qa66bef6/Q1ENhnWb30cdu9cQoeE\n2Jz4W0pg+ZH+CQMIaWXFbP4Z79Jgqd49X0YbF48Qb8Lz02/tTi2uhyssMmUx\n+SiMf57ROgKif7MVHtSDDhggzPVzvIiO6bZFNBKzPSsxAnfwyBrEdakBZ2jf\n5807bm90X2Zvcl9lbWFpbF91c2VAZG9tYWluLnRsZCA8bm90X2Zvcl9lbWFp\nbF91c2VAZG9tYWluLnRsZD7CjwQQFgoAIAUCYZYvQwYLCQcIAwIEFQgKAgQW\nAgEAAhkBAhsDAh4BACEJEJjKJHXT+N7qFiEEnkG18qZJDAQiz4i/mMokddP4\n3urgQgD+LI33CnxtImG5itTEdXHAS3E+oQkTv0eRv0GKvUTff1wA/isu2UKO\n0oagG/4ZaydLEKnh65sC03KSKy/WDnEpPEAMx4sEYZYvQxIKKwYBBAGXVQEF\nAQEHQGdDIKW1oEv2p4wvBEfkibOD1Ey03uecLDFWZ2Nb5g4zAwEIB/4JAwg2\nupFO+VHAx2CGNlWxM7g+KRr0zb1bFDZnGdVNE/AxJvzZUOuRA5rjGJxM6vac\nFOpH6fL4zNm+BJsu54OiVvxNfVAjyPSmrCk5JbDOGif4wngEGBYIAAkFAmGW\nL0MCGwwAIQkQmMokddP43uoWIQSeQbXypkkMBCLPiL+YyiR10/je6tSoAQDx\ndRTZmvcbkKe6k+F+EOa/Tmp/lARzEYMmWpnQcmI9cQD6AhgeFjDh+r+XY+q1\nZ2fGhDHqYiLQd0s+LmRzq8Tnfwo=\n=y2fV\n-----END PGP PRIVATE KEY BLOCK-----\n',
                Fingerprint: '9e41b5f2a6490c0422cf88bf98ca2475d3f8deea',
                Active: 1,
            },
        ],
        ToMigrate: 0,
        Email: 'stest1@proton.black',
        DisplayName: 'Bad Boy',
    },
});
