import { omit } from 'lodash';
import Papa from 'papaparse';

import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { prepare, readCsv } from '../../lib/contacts/helpers/csv';
import {
    addVCardProperty,
    compareVCardPropertyByPref,
    compareVCardPropertyByUid,
    getContactCategories,
    getContactEmails,
    getSortedProperties,
    getVCardProperties,
    mergeVCard,
    removeVCardProperty,
} from '../../lib/contacts/properties';
import { prepareForSaving } from '../../lib/contacts/surgery';
import { parseToVCard, vCardPropertiesToICAL } from '../../lib/contacts/vcard';
import { toCRLF } from '../../lib/helpers/string';

const vcardContactA: VCardContact = {
    version: {
        field: 'version',
        value: '4.0',
        uid: 'contact-property-5',
    },
    note: [
        {
            field: 'note',
            value: 'xzcvadfsasdf',
            uid: 'contact-property-2',
            group: 'item1',
        },
    ],
    n: {
        field: 'n',
        value: {
            familyNames: [''],
            givenNames: [''],
            additionalNames: [''],
            honorificPrefixes: [''],
            honorificSuffixes: [''],
        },
        uid: 'contact-property-3',
    },
    org: [
        {
            field: 'org',
            value: {
                organizationalName: 'Test',
                organizationalUnitNames: [' Y', ' Z'],
            },
            uid: 'contact-property-4',
            group: 'item1',
        },
    ],
    fn: [
        {
            field: 'fn',
            value: '<Unknown>',
            uid: 'contact-property-8',
            params: {
                pref: '1',
            },
        },
    ],
    email: [
        {
            field: 'email',
            value: 'tt@n.com',
            uid: 'contact-property-9',
            params: {
                type: '',
                pref: '1',
            },
            group: 'item1',
        },
        {
            field: 'email',
            value: 'ttestb@protontech.com',
            uid: 'contact-property-19',
            params: {
                pref: '3',
            },
        },
    ],
};

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
});

describe('mergeVCard', () => {
    const vcardContactB: VCardContact = {
        version: {
            field: 'version',
            value: '4.0',
            uid: 'contact-property-15',
        },
        email: [
            {
                field: 'email',
                value: 'test@example.com',
                uid: 'contact-property-12',
                group: 'item0',
            },
        ],
        fn: [
            {
                field: 'fn',
                value: '😡',
                uid: 'contact-property-14',
            },
        ],
        n: {
            field: 'n',
            value: {
                familyNames: [''],
                givenNames: ['😡'],
                additionalNames: [''],
                honorificPrefixes: [''],
                honorificSuffixes: [''],
            },
            uid: 'contact-property-17',
        },
    };

    it('should merge both vcard', () => {
        const mergedContact = mergeVCard([vcardContactA, vcardContactB]);

        expect(mergedContact).toEqual({
            version: {
                field: 'version',
                value: '4.0',
                uid: 'contact-property-15',
            },
            note: [
                {
                    field: 'note',
                    value: 'xzcvadfsasdf',
                    uid: 'contact-property-2',
                    group: 'item1',
                },
            ],
            n: {
                field: 'n',
                value: {
                    familyNames: [''],
                    givenNames: ['😡'],
                    additionalNames: [''],
                    honorificPrefixes: [''],
                    honorificSuffixes: [''],
                },
                uid: 'contact-property-17',
            },
            org: [
                {
                    field: 'org',
                    value: {
                        organizationalName: 'Test',
                        organizationalUnitNames: [' Y', ' Z'],
                    },
                    uid: 'contact-property-4',
                    group: 'item1',
                },
            ],
            fn: [
                {
                    field: 'fn',
                    value: '<Unknown>',
                    uid: 'contact-property-8',
                    params: {
                        pref: '1',
                    },
                },
                {
                    field: 'fn',
                    value: '😡',
                    uid: 'contact-property-14',
                },
            ],
            email: [
                {
                    field: 'email',
                    value: 'tt@n.com',
                    uid: 'contact-property-9',
                    params: {
                        type: '',
                        pref: '1',
                    },
                    group: 'item1',
                },
                {
                    field: 'email',
                    value: 'ttestb@protontech.com',
                    uid: 'contact-property-19',
                    params: { pref: '3' },
                },
                {
                    field: 'email',
                    value: 'test@example.com',
                    uid: 'contact-property-12',
                    group: 'item0',
                },
            ],
        });
    });
});

// TODO: check for mock
describe('addVCardProperty', () => {
    describe('when property is multi value', () => {
        it('should push new property', () => {
            const vcardProperty: VCardProperty = {
                field: 'email',
                value: 'helloworld@protontest.tech',
                uid: 'test-1',
            };

            const { newVCardContact, newVCardProperty } = addVCardProperty(vcardContactA, vcardProperty);

            expect(newVCardContact).toEqual({
                version: {
                    field: 'version',
                    value: '4.0',
                    uid: 'contact-property-5',
                },
                note: [
                    {
                        field: 'note',
                        value: 'xzcvadfsasdf',
                        uid: 'contact-property-2',
                    },
                ],
                n: {
                    field: 'n',
                    value: {
                        familyNames: [''],
                        givenNames: [''],
                        additionalNames: [''],
                        honorificPrefixes: [''],
                        honorificSuffixes: [''],
                    },
                    uid: 'contact-property-3',
                },
                org: [
                    {
                        field: 'org',
                        value: {
                            organizationalName: 'Test',
                            organizationalUnitNames: [' Y', ' Z'],
                        },
                        uid: 'contact-property-4',
                    },
                ],
                fn: [
                    {
                        field: 'fn',
                        value: '<Unknown>',
                        uid: 'contact-property-8',
                        params: {
                            pref: '1',
                        },
                    },
                ],
                email: [
                    {
                        field: 'email',
                        value: 'tt@n.com',
                        uid: 'contact-property-9',
                        params: {
                            type: '',
                            pref: '1',
                        },
                        group: 'item1',
                    },
                    {
                        field: 'email',
                        value: 'helloworld@protontest.tech',
                        uid: 'contact-property-0',
                    },
                ],
            });

            expect(newVCardProperty).toEqual({
                field: 'email',
                value: 'helloworld@protontest.tech',
                uid: 'contact-property-0',
            });
        });
    });

    describe('when property is single value', () => {
        it('should replace property', () => {
            const vcardProperty: VCardProperty = {
                field: 'n',
                value: {
                    familyNames: ['Delatour'],
                    givenNames: ['Albert'],
                    additionalNames: [''],
                    honorificPrefixes: [''],
                    honorificSuffixes: [''],
                },
                uid: 'test-1',
            };

            const { newVCardContact, newVCardProperty } = addVCardProperty(vcardContactA, vcardProperty);

            expect(newVCardContact).toEqual({
                version: {
                    field: 'version',
                    value: '4.0',
                    uid: 'contact-property-5',
                },
                note: [
                    {
                        field: 'note',
                        value: 'xzcvadfsasdf',
                        uid: 'contact-property-2',
                    },
                ],
                n: {
                    field: 'n',
                    value: {
                        familyNames: ['Delatour'],
                        givenNames: ['Albert'],
                        additionalNames: [''],
                        honorificPrefixes: [''],
                        honorificSuffixes: [''],
                    },
                    uid: 'contact-property-0',
                },
                org: [
                    {
                        field: 'org',
                        value: {
                            organizationalName: 'Test',
                            organizationalUnitNames: [' Y', ' Z'],
                        },
                        uid: 'contact-property-4',
                    },
                ],
                fn: [
                    {
                        field: 'fn',
                        value: '<Unknown>',
                        uid: 'contact-property-8',
                        params: {
                            pref: '1',
                        },
                    },
                ],
                email: [
                    {
                        field: 'email',
                        value: 'tt@n.com',
                        uid: 'contact-property-9',
                        params: {
                            type: '',
                            pref: '1',
                        },
                        group: 'item1',
                    },
                ],
            });

            expect(newVCardProperty).toEqual({
                field: 'n',
                value: {
                    familyNames: ['Delatour'],
                    givenNames: ['Albert'],
                    additionalNames: [''],
                    honorificPrefixes: [''],
                    honorificSuffixes: [''],
                },
                uid: 'test-1',
            });
        });
    });
});

describe('removeVCardProperty', () => {
    describe('when removed uid is last of multivalue property', () => {
        it('should remove the whole field', () => {
            const contactWithRemovedProperty = removeVCardProperty(vcardContactA, 'contact-property-2');
            expect(contactWithRemovedProperty).toEqual(omit(vcardContactA, 'note'));
        });
    });

    describe('when removed uid is not the last of multivalue property', () => {
        it('should remove the whole field', () => {
            const contact: VCardContact = {
                ...vcardContactA,
                note: [
                    {
                        field: 'note',
                        value: 'frutrjfrfztgh',
                        uid: 'contact-property-22',
                    },
                    {
                        field: 'note',
                        value: 'xzcvadfsasdf',
                        uid: 'contact-property-2',
                    },
                ],
            };

            const contactWithRemovedProperty = removeVCardProperty(contact, 'contact-property-2');
            expect(contactWithRemovedProperty).toEqual({
                ...vcardContactA,
                note: [
                    {
                        field: 'note',
                        value: 'frutrjfrfztgh',
                        uid: 'contact-property-22',
                    },
                ],
            });
        });
    });

    describe('when there is no match', () => {
        it('should return same vcards', () => {
            const contactWithRemovedProperty = removeVCardProperty(vcardContactA, 'contact-property-xyz');
            expect(contactWithRemovedProperty).toEqual(vcardContactA);
        });
    });

    describe('when removing an email property', () => {
        it('should remove properties with same group as well', () => {
            const contactWithRemovedProperty = removeVCardProperty(vcardContactA, 'contact-property-9');

            expect(contactWithRemovedProperty).toEqual({
                ...omit(vcardContactA, ['email', 'org', 'note']),
                email: [
                    {
                        field: 'email',
                        value: 'ttestb@protontech.com',
                        uid: 'contact-property-19',
                        params: { pref: '3' },
                    },
                ],
            });
        });
    });

    describe('when removing a photo property', () => {
        describe('when it is last property', () => {
            it('should push empty photo', () => {
                const contact: VCardContact = {
                    ...vcardContactA,
                    photo: [{ value: 'xyz.jpeg', field: 'photo', uid: 'test-uid' }],
                };
                const contactWithRemovedProperty = removeVCardProperty(contact, 'test-uid');

                expect(contactWithRemovedProperty.photo?.length).toBe(1);
                expect(contactWithRemovedProperty.photo?.[0].uid).not.toBe('test-uid');
            });
        });
    });
});

describe('compareVCardPropertyByUid', () => {
    const prop1: VCardProperty = {
        field: 'fn',
        uid: 'contact-property-2',
        value: 'Albert Delabatte',
    };

    const prop2: VCardProperty = {
        field: 'email',
        uid: 'contact-property-5',
        value: 'helloworld@protontest.tech',
    };

    describe('when a uid is greater than b uid', () => {
        it('should return -1', () => {
            expect(compareVCardPropertyByUid(prop1, prop2)).toBe(-1);
        });
    });

    describe('when a uid is lower than b uid', () => {
        it('should return 1', () => {
            expect(compareVCardPropertyByUid(prop2, prop1)).toBe(1);
        });
    });
});

describe('compareVCardPropertyByPref', () => {
    const prop1: VCardProperty = {
        field: 'fn',
        uid: 'contact-property-2',
        value: 'Albert Delabatte',
        params: { pref: '1' },
    };

    const prop2: VCardProperty = {
        field: 'email',
        uid: 'contact-property-5',
        value: 'helloworld@protontest.tech',
        params: { pref: '3' },
    };

    describe('when pref param is present and valid', () => {
        describe('when a pref is greater than b pref', () => {
            it('should return -1', () => {
                expect(compareVCardPropertyByPref(prop1, prop2)).toBe(-1);
            });
        });

        describe('when a pref is lower than b pref', () => {
            it('should return 1', () => {
                expect(compareVCardPropertyByPref(prop2, prop1)).toBe(1);
            });
        });
    });

    describe('when pref param is not present or invalid', () => {
        describe('when a pref is greater than b pref', () => {
            it('should fallback to compareVCardPropertyByUid and return -1', () => {
                expect(compareVCardPropertyByPref(prop1, prop2)).toBe(-1);
            });
        });
    });
});

describe('getSortedProperties', () => {
    it('should filter out fields and sort properties', () => {
        expect(getSortedProperties(vcardContactA, 'email')).toEqual([
            {
                field: 'email',
                value: 'tt@n.com',
                uid: 'contact-property-9',
                params: {
                    type: '',
                    pref: '1',
                },
                group: 'item1',
            },
            {
                field: 'email',
                value: 'ttestb@protontech.com',
                uid: 'contact-property-19',
                params: { pref: '3' },
            },
        ]);
    });
});
