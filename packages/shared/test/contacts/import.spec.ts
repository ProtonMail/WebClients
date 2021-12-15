import {
    extractContactImportCategories,
    getContactId,
    getImportCategories,
    getSupportedContact,
} from '../../lib/contacts/helpers/import';
import { extractVcards } from '../../lib/contacts/vcard';
import { toCRLF } from '../../lib/helpers/string';
import { ContactMetadata, ContactProperties, EncryptedContact, ImportedContact } from '../../lib/interfaces/contacts';

describe('import', () => {
    describe('extract vcards', () => {
        it('should keep the line separator used in the vcard', () => {
            const vcardsPlain = `BEGIN:VCARD
VERSION:4.0
FN:One
END:VCARD
BEGIN:VCARD
VERSION:4.0
FN:Two
END:VCARD`;
            const vcardsCRLF = toCRLF(vcardsPlain);
            expect(extractVcards(vcardsPlain)).toEqual([
                'BEGIN:VCARD\nVERSION:4.0\nFN:One\nEND:VCARD',
                'BEGIN:VCARD\nVERSION:4.0\nFN:Two\nEND:VCARD',
            ]);
            expect(extractVcards(vcardsCRLF)).toEqual([
                'BEGIN:VCARD\r\nVERSION:4.0\r\nFN:One\r\nEND:VCARD',
                'BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Two\r\nEND:VCARD',
            ]);
        });

        it('extracts vcards separated by empty lines', () => {
            const vcardsPlain = `BEGIN:VCARD
VERSION:4.0
FN:One
END:VCARD

BEGIN:VCARD
VERSION:4.0
FN:Two
END:VCARD
`;
            expect(extractVcards(vcardsPlain)).toEqual([
                'BEGIN:VCARD\nVERSION:4.0\nFN:One\nEND:VCARD',
                'BEGIN:VCARD\nVERSION:4.0\nFN:Two\nEND:VCARD',
            ]);
        });
    });

    describe('getContactId', () => {
        it('should retrieve FN value whenever present', () => {
            expect(
                getContactId(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
END:VCARD`)
            ).toEqual('J. Doe');
            expect(
                getContactId(`BEGIN:VCARD
VERSION:4.0
FN:Simon Perreault
N:Perreault;Simon;;;ing. jr,M.Sc.
BDAY:--0203
ANNIVERSARY:20090808T1430-0500
GENDER:M
LANG;PREF=1:fr
LANG;PREF=2:en
ORG;TYPE=work:Viagenie
ADR;TYPE=work:;Suite D2-630;2875 Laurier;
Quebec;QC;G1V 2M2;Canada
TEL;VALUE=uri;TYPE="work,voice";PREF=1:tel:+1-418-656-9254;ext=102
TEL;VALUE=uri;TYPE="work,cell,voice,video,text":tel:+1-418-262-6501
EMAIL;TYPE=work:simon.perreault@viagenie.ca
GEO;TYPE=work:geo:46.772673,-71.282945
KEY;TYPE=work;VALUE=uri:
http://www.viagenie.ca/simon.perreault/simon.asc
TZ:-0500
URL;TYPE=home:http://nomis80.org
END:VCARD`)
            ).toEqual('Simon Perreault');
        });

        it('should retrieve FN when multiple lines are present', () => {
            expect(
                getContactId(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3
 -424c-9c26-36
 c3e1eff6b1
FN;PID=1.1:Joh
 nnie
  Do
 e
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
END:VCARD`)
            ).toEqual('Johnnie Doe');
        });

        it('should crop FN when too long', () => {
            expect(
                getContactId(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3
 -424c-9c26-36
 c3e1eff6b1
FN;PID=1.1:This contact has a very loo
 ong name, but that's a pity since no
 one will remember such a long one
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
END:VCARD`)
            ).toEqual('This contact has a very looong name, bu…');
        });
    });

    describe('extractCategories', () => {
        it('should pick the right contactEmail ids for a contact with categories', () => {
            const contact = {
                ID: 'contact',
                ContactEmails: [
                    {
                        ID: 'one',
                        Email: 'one@email.test',
                    },
                    {
                        ID: 'two',
                        Email: 'two@email.test',
                    },
                    {
                        ID: 'three',
                        Email: 'three@email.test',
                    },
                ],
            } as ContactMetadata;
            const encryptedContact = {
                contactEmails: [
                    { email: 'one@email.test', group: 'item1' },
                    { email: 'two@email.test', group: 'item2' },
                    { email: 'three@email.test', group: 'item3' },
                ],
                categories: [
                    { name: 'dogs', group: 'item1' },
                    { name: 'cats', group: 'item2' },
                    { name: 'cats', group: 'item3' },
                    { name: 'pets', group: 'item2' },
                    { name: 'all' },
                ],
            } as EncryptedContact;
            const result = [
                { name: 'dogs', contactEmailIDs: ['one'] },
                { name: 'cats', contactEmailIDs: ['two', 'three'] },
                { name: 'pets', contactEmailIDs: ['two'] },
                { name: 'all', contactEmailIDs: ['one', 'two', 'three'] },
            ];
            expect(extractContactImportCategories(contact, encryptedContact)).toEqual(result);
        });
    });

    it('should pick the right contactEmail ids for a contact with categories', () => {
        const contact = {
            ID: 'contact',
            ContactEmails: [
                {
                    ID: 'one',
                    Email: 'one@email.test',
                },
                {
                    ID: 'two',
                    Email: 'two@email.test',
                },
                {
                    ID: 'three',
                    Email: 'three@email.test',
                },
            ],
        } as ContactMetadata;
        const encryptedContact = {
            contactEmails: [
                { email: 'one@email.test', group: 'item1' },
                { email: 'two@email.test', group: 'item2' },
                { email: 'three@email.test', group: 'item3' },
            ],
            categories: [],
        } as unknown as EncryptedContact;
        expect(extractContactImportCategories(contact, encryptedContact)).toEqual([]);
    });

    describe('getImportCategories', () => {
        it('should combine contact email ids and contact ids from different contacts', () => {
            const contacts: ImportedContact[] = [
                {
                    contactID: 'contact1',
                    contactEmailIDs: ['contactemail1-1', 'contactemail1-2'],
                    categories: [
                        { name: 'cats', contactEmailIDs: ['contactemail1-1', 'contactemail1-2'] },
                        { name: 'dogs', contactEmailIDs: ['contactemail1-1'] },
                        { name: 'pets' },
                    ],
                },
                {
                    contactID: 'contact2',
                    contactEmailIDs: [],
                    categories: [{ name: 'dogs' }, { name: 'birds' }],
                },
                {
                    contactID: 'contact3',
                    contactEmailIDs: ['contactemail3-1', 'contactemail3-2'],
                    categories: [
                        { name: 'all' },
                        { name: 'dogs', contactEmailIDs: ['contactemail3-1'] },
                        { name: 'pets', contactEmailIDs: ['contactemail3-2'] },
                    ],
                },
            ];
            const result = [
                {
                    name: 'cats',
                    contactEmailIDs: [],
                    contactIDs: ['contact1'],
                    totalContacts: 1,
                },
                {
                    name: 'dogs',
                    contactEmailIDs: ['contactemail1-1', 'contactemail3-1'],
                    contactIDs: [],
                    totalContacts: 2,
                },
                { name: 'pets', contactEmailIDs: ['contactemail3-2'], contactIDs: [], totalContacts: 1 },
            ];
            expect(getImportCategories(contacts)).toEqual(result);
        });
    });

    describe('getSupportedContacts', () => {
        const getExpectedProperties = (withLineBreaks = false) => {
            return [
                {
                    field: 'version',
                    value: '4.0',
                    pref: undefined,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'adr',
                    value: ['', '', withLineBreaks ? 'street with line breaks' : 'street', 'city', '', '00000', 'FR'],
                    pref: 1,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'org',
                    value: ['company'],
                    pref: undefined,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'bday',
                    value: '1999-01-01',
                    pref: undefined,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'note',
                    value: 'Notes',
                    pref: undefined,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'tel',
                    value: '00 00000000',
                    pref: 1,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'title',
                    value: 'title',
                    pref: undefined,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'fn',
                    value: 'Name',
                    pref: 1,
                    group: undefined,
                    type: undefined,
                },
                {
                    field: 'email',
                    value: 'email1@protonmail.com',
                    pref: 1,
                    group: 'item1',
                    type: undefined,
                },
            ] as ContactProperties;
        };

        it('should import normal vCard correctly', () => {
            const vCard = `BEGIN:VCARD
VERSION:4.0
ADR:;;street;city;;00000;FR
ORG:company
BDAY:19990101
NOTE:Notes
TEL;PREF=1:00 00000000
TITLE:title
FN;PREF=1:Name
ITEM1.EMAIL;PREF=1:email1@protonmail.com
END:VCARD`;

            const expected = getExpectedProperties();

            const contact = getSupportedContact(vCard);

            expect(contact).toEqual(expected);
        });

        it('should import vCard with address containing \\r\\n correctly', () => {
            const vCard = `BEGIN:VCARD
VERSION:4.0
ADR:;;street\\r\\nwith\\r\\nline\\r\\nbreaks;city;;00000;FR
ORG:company
BDAY:19990101
NOTE:Notes
TEL;PREF=1:00 00000000
TITLE:title
FN;PREF=1:Name
ITEM1.EMAIL;PREF=1:email1@protonmail.com
END:VCARD`;

            const expected = getExpectedProperties(true);

            const contact = getSupportedContact(vCard);

            expect(contact).toEqual(expected);
        });

        it('should import vCard with address containing \\\\n correctly', () => {
            const vCard = `BEGIN:VCARD
VERSION:4.0
ADR:;;street\\nwith\\nline\\nbreaks;city;;00000;FR
ORG:company
BDAY:19990101
NOTE:Notes
TEL;PREF=1:00 00000000
TITLE:title
FN;PREF=1:Name
ITEM1.EMAIL;PREF=1:email1@protonmail.com
END:VCARD`;

            const expected = getExpectedProperties(true);

            const contact = getSupportedContact(vCard);

            expect(contact).toEqual(expected);
        });
    });

    it('should import BDAY and ANNIVERSARY', () => {
        const vCard = `BEGIN:VCARD
VERSION:4.0
BDAY:19990101
ANNIVERSARY:19990101
END:VCARD`;

        const expected = [
            {
                field: 'version',
                value: '4.0',
                pref: undefined,
                group: undefined,
                type: undefined,
            },
            {
                field: 'bday',
                value: '1999-01-01',
                pref: undefined,
                group: undefined,
                type: undefined,
            },
            {
                field: 'anniversary',
                value: '1999-01-01',
                pref: undefined,
                group: undefined,
                type: undefined,
            },
        ] as ContactProperties;

        const contact = getSupportedContact(vCard);

        expect(contact).toEqual(expected);
    });

    it('should import BDAY and ANNIVERSARY with text format', () => {
        const vCard = `BEGIN:VCARD
VERSION:4.0
BDAY:VALUE=text:bidet
ANNIVERSARY:VALUE=text:annie
END:VCARD`;

        const expected = [
            {
                field: 'version',
                value: '4.0',
                pref: undefined,
                group: undefined,
                type: undefined,
            },
            {
                field: 'bday',
                value: 'bidet',
                pref: undefined,
                group: undefined,
                type: undefined,
            },
            {
                field: 'anniversary',
                value: 'annie',
                pref: undefined,
                group: undefined,
                type: undefined,
            },
        ] as ContactProperties;

        const contact = getSupportedContact(vCard);

        expect(contact).toEqual(expected);
    });
});
