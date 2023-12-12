import { extractMergeable, merge } from '@proton/shared/lib/contacts/helpers/merge';
import { FormattedContact } from '@proton/shared/lib/interfaces/contacts/FormattedContact';
import { VCardContact, VCardGender } from '@proton/shared/lib/interfaces/contacts/VCard';

type TestContact = Pick<FormattedContact, 'Name' | 'emails'>;

/**
 * Check if two contacts match
 * @dev For this test, for contact equality it's enough to check that the 'Name' and 'emails' properties match
 */
const doContactsMatch = (contactLeft: TestContact, contactRight: TestContact) => {
    const { Name: nameLeft, emails: emailsLeft } = contactLeft;
    const { Name: nameRight, emails: emailsRight } = contactRight;

    if (nameLeft !== nameRight) {
        return false;
    }
    return emailsLeft.length === emailsRight.length && emailsLeft.every((email, i) => email === emailsRight[i]);
};

/**
 * Check if two arrays of contacts contain the same list of contacts, possibly in a different order
 */
const doContactListsMatch = (contactsLeft: TestContact[], contactsRight: TestContact[]) => {
    const differentContactsRight = [...contactsRight];

    for (const contactLeft of contactsLeft) {
        const index = differentContactsRight.findIndex((contact) => doContactsMatch(contact, contactLeft));

        if (index === -1) {
            return false;
        }
        differentContactsRight.splice(index, 1);
    }

    return !differentContactsRight.length;
};

/**
 * Check if two arrays of contacts lists match, possibly in a different order
 */
const doContactListArraysMatch = (contactListsLeft: TestContact[][], contactListsRight: TestContact[][]) => {
    const differentContactListsRight = [...contactListsRight];

    for (const contactListLeft of contactListsLeft) {
        const index = differentContactListsRight.findIndex((contactList) =>
            doContactListsMatch(contactList, contactListLeft)
        );

        if (index === -1) {
            return false;
        }
        differentContactListsRight.splice(index, 1);
    }

    return !differentContactListsRight.length;
};

describe('merge', () => {
    describe('extractMergeable', () => {
        it('should detect as mergeable multiple contacts with the same normalized name and same normalized email', () => {
            // only names and emails are relevant for the logic of extractMergeable
            const contacts = [
                {
                    Name: 'TestName',
                    emails: ['testname@pm.me', 'TestName@protonmail.com'],
                },
                { Name: 'Someone else', emails: ['else@proton.me'] },
                { Name: 'TESTNAME', emails: ['TESTNAME@proton.me'] },
                { Name: 'testname', emails: ['testname@pm.me'] },
                { Name: 'Party crasher', emails: ['party_crasher@proton.me'] },
                {
                    Name: 'TestEmail',
                    emails: ['testemail@pm.me', 'TestEmail@protonmail.com'],
                },
                { Name: 'Another one', emails: ['another@proton.me'] },
                { Name: 'I am testing email', emails: ['TESTEMAIL@pm.me'] },
                {
                    Name: 'Party crasher friend 1',
                    emails: ['party_crasher_friend_1@proton.me'],
                },
                {
                    Name: 'Party crasher friend 2',
                    emails: ['party_crasher_friend_2@proton.me'],
                },
                {
                    Name: 'A final email test',
                    emails: ['Testemail@protonmail.com', 'another@pm.me'],
                },
            ] as FormattedContact[];
            const mergeableContacts = extractMergeable(contacts);
            const expectedMergeableContacts = [
                // mergeable by name
                [contacts[0], contacts[2], contacts[3]],
                // mergeable by email
                [contacts[5], contacts[7], contacts[10]],
            ];

            expect(doContactListArraysMatch(mergeableContacts, expectedMergeableContacts)).toEqual(true);
        });

        it('should detect as mergeable two contacts with different names and emails, but which share a name and an email with a third one', () => {
            // only names and emails are relevant for the logic of extractMergeable
            const contacts = [
                { Name: 'First', emails: ['first@pm.me'] },
                { Name: 'Second', emails: ['second@proton.me', 'first@pm.me'] },
                { Name: 'second', emails: ['third@proton.me'] },
            ] as FormattedContact[];
            const mergeableContacts = extractMergeable(contacts);

            expect(doContactListArraysMatch(mergeableContacts, [contacts])).toEqual(true);
        });

        it('should not detect as mergeable two contacts with unknown names added by Proton', () => {
            // only names and emails are relevant for the logic of extractMergeable
            const contacts = [
                { Name: 'Unknown', emails: ['first@pm.me'] },
                {
                    Name: 'Unknown',
                    emails: ['second@proton.me', 'another@pm.me'],
                },
                { Name: '<Unknown>', emails: ['third@proton.me'] },
                { Name: '<Unknown>', emails: ['fourth@proton.me'] },
            ] as FormattedContact[];
            const mergeableContacts = extractMergeable(contacts);

            expect(doContactListArraysMatch(mergeableContacts, [])).toEqual(true);
        });
    });

    fdescribe('merge', () => {
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
            // Single-value: Present in A and C
            bday: {
                field: 'bday',
                value: { date: new Date('1997-11-03') },
                uid: 'contact-property-101',
            },
            // Single-value: Present in A and B
            anniversary: {
                field: 'anniversary',
                value: { date: new Date('2002-01-03') },
                uid: 'contact-property-108',
            },
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
            // Single-value: Present in A and B
            anniversary: {
                field: 'anniversary',
                value: { date: new Date('2007-02-03') },
                uid: 'contact-property-102',
            },
            // Single-value: Present in B and C
            gender: {
                field: 'gender',
                uid: 'contact-property-104',
                value: {
                    gender: VCardGender.Female,
                    text: 'female',
                },
            },
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

        const vcardContactC: VCardContact = {
            version: {
                field: 'version',
                value: '4.0',
                uid: 'contact-property-107',
            },
            fn: [
                {
                    field: 'fn',
                    value: 'qaengineer@protonmail.com',
                    uid: 'contact-property-99',
                    params: {
                        pref: '1',
                    },
                },
            ],
            // Single-value: Present in A and C
            bday: {
                field: 'bday',
                value: { date: new Date('1993-10-06') },
                uid: 'contact-property-101',
            },
            // Single-value: Present in B and C
            gender: {
                field: 'gender',
                uid: 'contact-property-103',
                value: {
                    gender: VCardGender.Male,
                    text: 'male',
                },
            },
            key: [
                {
                    field: 'key',
                    value: 'data:application/pgp-keys;base64,xsBNBFvtGAYBCACl7v...',
                    uid: 'contact-property-101',
                    params: {
                        pref: '1',
                    },
                    group: 'item1',
                },
            ],
            'x-pm-sign': [
                {
                    field: 'x-pm-sign',
                    value: true,
                    uid: 'contact-property-102',
                    group: 'item1',
                },
            ],
            email: [
                {
                    field: 'email',
                    value: 'qaengineer2@protonmail.com',
                    uid: 'contact-property-103',
                    params: {
                        pref: '1',
                    },
                    group: 'item2',
                },
                {
                    field: 'email',
                    value: 'qaengineer@protonmail.com',
                    uid: 'contact-property-104',
                    params: {
                        pref: '2',
                    },
                    group: 'item3',
                },
                {
                    field: 'email',
                    value: 'test@example.com',
                    uid: 'contact-property-12',
                    group: 'item0',
                },
                {
                    field: 'email',
                    value: 'qaengineer3@protonmail.com',
                    uid: 'contact-property-105',
                    params: {
                        pref: '3',
                    },
                    group: 'item1',
                },
            ],
            org: [
                {
                    field: 'org',
                    value: {
                        organizationalName: 'Proton',
                    },
                    uid: 'contact-property-43',
                    group: 'item0',
                },
            ],
            photo: [
                {
                    field: 'photo',
                    value: 'data:image/jpeg;base64,/9j/4AAQSkZJRg....',
                    uid: 'contact-property-108',
                    params: {
                        pref: '1',
                    },
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
                uid: 'contact-property-109',
            },
        };

        // used to check that order priority is always respected
        let mergedContactABC: VCardContact;
        let mergedContactBAC: VCardContact;
        let mergedContactCBA: VCardContact;

        beforeEach(() => {
            mergedContactABC = merge([vcardContactA, vcardContactB, vcardContactC]);
            mergedContactBAC = merge([vcardContactB, vcardContactA, vcardContactC]);
            mergedContactCBA = merge([vcardContactC, vcardContactB, vcardContactA]);
        });

        it('should keep first and last name of the first contact', () => {
            expect(mergedContactABC.fn).toEqual(vcardContactA.fn);
            expect(mergedContactBAC.fn).toEqual([
                {
                    ...vcardContactB.fn[0],
                    params: {
                        pref: '1',
                    },
                },
            ]);
            expect(mergedContactCBA.fn).toEqual(vcardContactC.fn);
        });

        describe('field is single-value', () => {
            it('should set fields accordingly to contact priority order', () => {
                /**
                 * vCardContactA has `n`, `bday` and `anniversary` fields set, so they will be taken in priority
                 * but no `gender` set so we'll the value in the first next contact
                 */
                expect(mergedContactABC.n).toEqual(vcardContactA.n);
                expect(mergedContactABC.bday).toEqual(vcardContactA.bday);
                expect(mergedContactABC.anniversary).toEqual(vcardContactA.anniversary);
                expect(mergedContactABC.gender).toEqual(vcardContactB.gender);

                expect(mergedContactBAC.n).toEqual(vcardContactB.n);
                expect(mergedContactBAC.bday).toEqual(vcardContactA.bday);
                expect(mergedContactBAC.anniversary).toEqual(vcardContactB.anniversary);
                expect(mergedContactBAC.gender).toEqual(vcardContactB.gender);

                expect(mergedContactCBA.n).toEqual(vcardContactC.n);
                expect(mergedContactCBA.bday).toEqual(vcardContactC.bday);
                expect(mergedContactCBA.anniversary).toEqual(vcardContactB.anniversary);
                expect(mergedContactCBA.gender).toEqual(vcardContactC.gender);
            });
        });

        describe('field is multi-value', () => {
            it('should push properties in field, in priority order, if not already present', () => {
                expect(mergedContactABC.email).toEqual([
                    // emails from vCardContactA
                    {
                        field: 'email',
                        value: 'tt@n.com',
                        uid: 'contact-property-9',
                        params: { type: '', pref: '1' },
                        group: 'item1',
                    },
                    {
                        field: 'email',
                        value: 'ttestb@protontech.com',
                        uid: 'contact-property-19',
                        params: { pref: '2' },
                        group: 'item2',
                    },
                    // emails from vCardContactB
                    {
                        field: 'email',
                        value: 'test@example.com',
                        uid: 'contact-property-12',
                        group: 'item0',
                        params: { pref: '3' },
                    },
                    // emails from vCardContactC
                    // test@example.com has not been pushed since vCardContactB already has it
                    {
                        field: 'email',
                        value: 'qaengineer2@protonmail.com',
                        uid: 'contact-property-103',
                        params: { pref: '4' },
                        group: 'item3',
                    },
                    {
                        field: 'email',
                        value: 'qaengineer@protonmail.com',
                        uid: 'contact-property-104',
                        params: { pref: '5' },
                        group: 'item4',
                    },
                    {
                        field: 'email',
                        value: 'qaengineer3@protonmail.com',
                        uid: 'contact-property-105',
                        params: { pref: '6' },
                        group: 'item5',
                    },
                ]);

                expect(mergedContactBAC.email).toEqual([
                    // emails from vCardContactB
                    {
                        field: 'email',
                        value: 'test@example.com',
                        uid: 'contact-property-12',
                        group: 'item0',
                        params: { pref: '1' },
                    },
                    // emails from vCardContactA
                    {
                        field: 'email',
                        value: 'tt@n.com',
                        uid: 'contact-property-9',
                        params: { type: '', pref: '2' },
                        group: 'item1',
                    },
                    {
                        field: 'email',
                        value: 'ttestb@protontech.com',
                        uid: 'contact-property-19',
                        params: { pref: '3' },
                        group: 'item2',
                    },
                    // emails from vCardContactC
                    // test@example.com has not been pushed since vCardContactB already has it
                    {
                        field: 'email',
                        value: 'qaengineer2@protonmail.com',
                        uid: 'contact-property-103',
                        params: { pref: '4' },
                        group: 'item3',
                    },
                    {
                        field: 'email',
                        value: 'qaengineer@protonmail.com',
                        uid: 'contact-property-104',
                        params: { pref: '5' },
                        group: 'item4',
                    },
                    {
                        field: 'email',
                        value: 'qaengineer3@protonmail.com',
                        uid: 'contact-property-105',
                        params: { pref: '6' },
                        group: 'item5',
                    },
                ]);

                expect(mergedContactCBA.email).toEqual([
                    // emails from vCardContactC
                    {
                        field: 'email',
                        value: 'test@example.com',
                        uid: 'contact-property-12',
                        group: 'item0',
                        params: { pref: '1' },
                    },
                    {
                        field: 'email',
                        value: 'qaengineer2@protonmail.com',
                        uid: 'contact-property-103',
                        params: { pref: '2' },
                        group: 'item2',
                    },
                    {
                        field: 'email',
                        value: 'qaengineer@protonmail.com',
                        uid: 'contact-property-104',
                        params: { pref: '3' },
                        group: 'item3',
                    },
                    {
                        field: 'email',
                        value: 'qaengineer3@protonmail.com',
                        uid: 'contact-property-105',
                        params: { pref: '4' },
                        group: 'item1',
                    },
                    // no email from vCardContactB
                    //test@example.com has not been pushed since vCardContactC already has it

                    // emails from vCardContactA
                    {
                        field: 'email',
                        value: 'tt@n.com',
                        uid: 'contact-property-9',
                        params: { type: '', pref: '5' },
                        group: 'item4',
                    },
                    {
                        field: 'email',
                        value: 'ttestb@protontech.com',
                        uid: 'contact-property-19',
                        params: { pref: '6' },
                        group: 'item5',
                    },
                ]);
            });
        });
    });
});
