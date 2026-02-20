import Papa from 'papaparse';

import { prepare, readCsv, toVCardContacts } from '../../lib/contacts/helpers/csv';
import { getContactCategories, getContactEmails, getVCardProperties } from '../../lib/contacts/properties';
import { prepareForSaving } from '../../lib/contacts/surgery';
import { parseToVCard, vCardPropertiesToICAL } from '../../lib/contacts/vcard';
import { toCRLF } from '../../lib/helpers/string';

describe('getContactEmails', () => {
    it('should retrieve contact emails from a vcard contact', () => {
        const contact = prepareForSaving(
            parseToVCard(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
EMAIL:jdoeeeee@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
CATEGORIES:TRAVEL AGENT
CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
END:VCARD`)
        );
        const expected = [
            { email: 'jdoe@example.com', group: 'item1' },
            { email: 'jdoeeeee@example.com', group: 'item2' },
        ];

        expect(getContactEmails(contact)).toEqual(expected);
    });

    it('should not complain if contact emails properties do not contain a group', async () => {
        const contact = prepareForSaving(
            parseToVCard(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
EMAIL:jdoeeeee@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
CATEGORIES:TRAVEL AGENT
CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
END:VCARD`)
        );

        const expected = [
            { email: 'jdoe@example.com', group: 'item1' },
            { email: 'jdoeeeee@example.com', group: 'item2' },
        ];

        expect(getContactEmails(contact)).toEqual(expected);
    });
});

describe('getContactCategories', () => {
    it('should retrieve categories from a vcard contact without groups', () => {
        const contact = prepareForSaving(
            parseToVCard(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
EMAIL;PID=1.1:jdoe@example.com
EMAIL:jdoeeeee@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
CATEGORIES:TRAVEL AGENT
CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
END:VCARD`)
        );

        const expected = [
            { name: 'TRAVEL AGENT' },
            { name: 'INTERNET' },
            { name: 'IETF' },
            { name: 'INDUSTRY' },
            { name: 'INFORMATION TECHNOLOGY' },
        ];

        expect(getContactCategories(contact)).toEqual(expected);
    });

    it('should retrieve categories from a vcard contact with groups', () => {
        const contact = prepareForSaving(
            parseToVCard(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
ITEM1.EMAIL;PID=1.1:jdoe@example.com
ITEM2.EMAIL:jdoeeeee@example.com
ITEM3.EMAIL:jd@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
ITEM1.CATEGORIES:TRAVEL AGENT
ITEM2.CATEGORIES:INTERNET,IETF,INDUSTRY,INFORMATION TECHNOLOGY
ITEM3.CATEGORIES:TRAVEL AGENT,IETF
END:VCARD`)
        );

        const expected = [
            { name: 'TRAVEL AGENT', group: 'item1' },
            { name: 'INTERNET', group: 'item2' },
            { name: 'IETF', group: 'item2' },
            { name: 'INDUSTRY', group: 'item2' },
            { name: 'INFORMATION TECHNOLOGY', group: 'item2' },
            { name: 'TRAVEL AGENT', group: 'item3' },
            { name: 'IETF', group: 'item3' },
        ];

        expect(getContactCategories(contact)).toEqual(expected);
    });

    it('should return an empty array when there are no categories in the contact', () => {
        const contact = prepareForSaving(
            parseToVCard(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
ITEM1.EMAIL;PID=1.1:jdoe@example.com
ITEM2.EMAIL:jdoeeeee@example.com
ITEM3.EMAIL:jd@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
END:VCARD`)
        );

        expect(getContactCategories(contact)).toEqual([]);
    });
});

describe('toICAL', () => {
    it('should roundtrip', () => {
        const vcard = toCRLF(`BEGIN:VCARD
VERSION:4.0
BDAY:19691203
END:VCARD`);
        const contact = parseToVCard(vcard);
        const properties = getVCardProperties(contact);
        expect(vCardPropertiesToICAL(properties).toString()).toEqual(vcard);
    });
});

describe('readCSV', () => {
    it('should convert unwanted fields to notes', async () => {
        const csvData = [{ 'first name': 'name1', nickname: 'nickname1', related: 'related1' }];
        const csvColumns = ['first name', 'nickname', 'related'];
        const blob = new Blob([Papa.unparse({ data: csvData, fields: csvColumns })]);
        const csv = new File([blob], 'csvData.csv');

        const parsedCsvContacts = await readCsv(csv);
        const preVcardsContacts = prepare(parsedCsvContacts);

        expect(preVcardsContacts[0][0][0].field).toEqual('n');
        expect(preVcardsContacts[0][1][0].field).toEqual('fn');
        expect(preVcardsContacts[0][2][0].field).toEqual('note');
        expect(preVcardsContacts[0][3][0].field).toEqual('note');
        expect(preVcardsContacts[0].length).toEqual(4);
    });

    it('should map once birthday, anniversary and gender', async () => {
        const csvData = [
            {
                'first name': 'name1',
                birthday: '04/03/2021',
                birthday2: '03/01/2021',
                anniversary: '04/03/2021',
                anniversary2: '03/01/2021',
                gender: 'M',
                gender2: 'F',
            },
        ];
        const csvColumns = [
            'first name',
            'nickname',
            'birthday',
            'birthday',
            'anniversary',
            'anniversary',
            'gender',
            'gender',
        ];
        const blob = new Blob([Papa.unparse({ data: csvData, fields: csvColumns })]);
        const csv = new File([blob], 'csvData.csv');

        const parsedCsvContacts = await readCsv(csv);
        const preVcardsContacts = prepare(parsedCsvContacts);

        expect(preVcardsContacts[0][0][0].field).toEqual('n');
        expect(preVcardsContacts[0][1][0].field).toEqual('fn');
        expect(preVcardsContacts[0][2][0].field).toEqual('bday');
        expect(preVcardsContacts[0][3][0].field).toEqual('anniversary');
        expect(preVcardsContacts[0][4][0].field).toEqual('gender');
        expect(preVcardsContacts[0].length).toEqual(5);
    });

    it('should map known CSV headers to VCF fields', async () => {
        const cases: {
            headers: string;
            csvContent: string;
            propertyExpectations: {
                field: string;
                value: string | Record<string, string>;
                params?: Record<string, string>;
            }[];
        }[] = [
            {
                headers: `first  name,last name,organization,e-mail address,mobile,primary phone,address 1,city,state,zip,note,notes,website`,
                csvContent: `eric,norbert,,eric@proton.me,15556979792,15559190156,207 Street Lane,Locality,XX,99999,A note,Some notes,`,
                propertyExpectations: [
                    {
                        field: 'fn',
                        value: 'eric norbert',
                    },
                    {
                        field: 'email',
                        value: 'eric@proton.me',
                    },
                    {
                        field: 'adr',
                        value: {
                            postOfficeBox: '',
                            extendedAddress: '',
                            streetAddress: '207 Street Lane',
                            locality: 'Locality',
                            region: 'XX',
                            postalCode: '99999',
                            country: '',
                        },
                    },
                    {
                        field: 'tel',
                        value: '15559190156',
                        params: {
                            type: 'main',
                        },
                    },
                    {
                        field: 'tel',
                        value: '15556979792',
                        params: {
                            type: 'cell',
                        },
                    },
                ],
            },
            {
                headers: `first name,last name,organization,email-address,mobile phone,home phone,address,address 2,city,state,zip,note,notes,website`,
                csvContent: `Eric,Norbert,Proton AG,eric@proton.me,,555 123-9999,1337 Koenigsegg Street,Flat P,Ängelholm,,0431,, N/A ,`,
                propertyExpectations: [
                    {
                        field: 'fn',
                        value: 'Eric Norbert',
                    },
                    {
                        field: 'email',
                        value: 'eric@proton.me',
                    },
                    {
                        field: 'adr',
                        value: {
                            postOfficeBox: '',
                            extendedAddress: 'Flat P',
                            streetAddress: '1337 Koenigsegg Street',
                            locality: 'Ängelholm',
                            region: '',
                            postalCode: '0431',
                            country: '',
                        },
                    },
                    {
                        field: 'note',
                        value: 'N/A',
                    },
                    {
                        field: 'tel',
                        value: '555 123-9999',
                        params: {
                            type: 'home',
                        },
                    },
                ],
            },
        ];

        const results = await Promise.all(
            cases.map(async ({ headers, csvContent }, i) => {
                const textContent = `${headers}\n${csvContent}\n`;
                const blob = new Blob([textContent], { type: 'text/plain' });
                const file = new File([blob], `import-${i}.csv`);
                const csv = await readCsv(file);
                const preVcard = prepare(csv);
                return toVCardContacts(preVcard);
            })
        );

        for (const [i, testCase] of cases.entries()) {
            const [contact] = results[i].rest;
            const properties = getVCardProperties(contact);
            for (const expectation of testCase.propertyExpectations) {
                expect(properties).toContain(jasmine.objectContaining(expectation));
            }
        }
    });
});
