import { extractMergeable } from '@proton/shared/lib/contacts/helpers/merge';
import { FormattedContact } from '@proton/shared/lib/interfaces/contacts/FormattedContact';

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
                { Name: 'TestName', emails: ['testname@pm.me', 'TestName@protonmail.com'] },
                { Name: 'Someone else', emails: ['else@proton.me'] },
                { Name: 'TESTNAME', emails: ['TESTNAME@proton.me'] },
                { Name: 'testname', emails: ['testname@pm.me'] },
                { Name: 'Party crasher', emails: ['party_crasher@proton.me'] },
                { Name: 'TestEmail', emails: ['testemail@pm.me', 'TestEmail@protonmail.com'] },
                { Name: 'Another one', emails: ['another@proton.me'] },
                { Name: 'I am testing email', emails: ['TESTEMAIL@pm.me'] },
                { Name: 'Party crasher friend 1', emails: ['party_crasher_friend_1@proton.me'] },
                { Name: 'Party crasher friend 2', emails: ['party_crasher_friend_2@proton.me'] },
                { Name: 'A final email test', emails: ['Testemail@protonmail.com', 'another@pm.me'] },
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
                { Name: 'Unknown', emails: ['second@proton.me', 'another@pm.me'] },
                { Name: '<Unknown>', emails: ['third@proton.me'] },
                { Name: '<Unknown>', emails: ['fourth@proton.me'] },
            ] as FormattedContact[];
            const mergeableContacts = extractMergeable(contacts);

            expect(doContactListArraysMatch(mergeableContacts, [])).toEqual(true);
        });
    });
});
