import { extractContactImportCategories, getContactId, getImportCategories } from '../../lib/contacts/helpers/import';
import { ContactMetadata, EncryptedContact, ImportedContact } from '../../lib/interfaces/contacts';

describe('import', () => {
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
        const encryptedContact = ({
            contactEmails: [
                { email: 'one@email.test', group: 'item1' },
                { email: 'two@email.test', group: 'item2' },
                { email: 'three@email.test', group: 'item3' },
            ],
            categories: [],
        } as unknown) as EncryptedContact;
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
});
