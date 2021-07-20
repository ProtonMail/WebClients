import Papa from 'papaparse';

import { addGroup, addPref, getContactCategories, getContactEmails } from '../../lib/contacts/properties';
import { parse, toICAL } from '../../lib/contacts/vcard';
import { prepare, readCsv } from '../../lib/contacts/helpers/csv';
import { toCRLF } from '../calendar/veventHelper.spec';

describe('getContactEmails', () => {
    it('should retrieve contact emails from a vcard contact', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
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
            )
        );
        const result = [
            { email: 'jdoe@example.com', group: 'item1' },
            { email: 'jdoeeeee@example.com', group: 'item2' },
        ];
        expect(getContactEmails(properties)).toEqual(result);
    });

    it('should not complain if contact emails properties do not contain a group', async () => {
        const properties = addPref(
            parse(`BEGIN:VCARD
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
        const result = [
            { email: 'jdoe@example.com', group: 'item1' },
            { email: 'jdoeeeee@example.com', group: 'item2' },
        ];
        expect(getContactEmails(properties)).toEqual(result);
    });
});

describe('getContactCategories', () => {
    it('should retrieve categories from a vcard contact without groups', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
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
            )
        );
        const result = [
            { name: 'TRAVEL AGENT' },
            { name: 'INTERNET' },
            { name: 'IETF' },
            { name: 'INDUSTRY' },
            { name: 'INFORMATION TECHNOLOGY' },
        ];
        expect(getContactCategories(properties)).toEqual(result);
    });

    it('should retrieve categories from a vcard contact with groups', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
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
            )
        );
        const result = [
            { name: 'TRAVEL AGENT', group: 'item1' },
            { name: 'INTERNET', group: 'item2' },
            { name: 'IETF', group: 'item2' },
            { name: 'INDUSTRY', group: 'item2' },
            { name: 'INFORMATION TECHNOLOGY', group: 'item2' },
            { name: 'TRAVEL AGENT', group: 'item3' },
            { name: 'IETF', group: 'item3' },
        ];
        expect(getContactCategories(properties)).toEqual(result);
    });

    it('should return an empty array when there are no categories in the contact', () => {
        const properties = addGroup(
            addPref(
                parse(`BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN;PID=1.1:J. Doe
N:Doe;J.;;;
ITEM1.EMAIL;PID=1.1:jdoe@example.com
ITEM2.EMAIL:jdoeeeee@example.com
ITEM3.EMAIL:jd@example.com
CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556
END:VCARD`)
            )
        );
        expect(getContactCategories(properties)).toEqual([]);
    });
});

describe('toICAL', () => {
    it('should roundtrip', () => {
        const vcard = toCRLF(`BEGIN:VCARD
VERSION:4.0
BDAY:19691203
END:VCARD`);
        const properties = parse(vcard);
        expect(toICAL(properties).toString()).toEqual(vcard);
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

        expect(preVcardsContacts[0][0][0].field).toEqual('fn');
        expect(preVcardsContacts[0][1][0].field).toEqual('note');
        expect(preVcardsContacts[0][2][0].field).toEqual('note');
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

        expect(preVcardsContacts[0][0][0].field).toEqual('fn');
        expect(preVcardsContacts[0][1][0].field).toEqual('bday');
        expect(preVcardsContacts[0][2][0].field).toEqual('anniversary');
        expect(preVcardsContacts[0][3][0].field).toEqual('gender');
        expect(preVcardsContacts[0].length).toEqual(4);
    });
});
