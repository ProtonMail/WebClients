import { toVCardContacts } from '@proton/shared/lib/contacts/helpers/csv';
import { fromVCardProperties, getVCardProperties } from '@proton/shared/lib/contacts/properties';
import { PreVcardProperty, PreVcardsContact } from '@proton/shared/lib/interfaces/contacts';
import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

const excludeFieldsForVerification = (contacts: VCardContact[]) => {
    return contacts.map((contact) => {
        const properties = getVCardProperties(contact).map(({ uid, params, ...property }) => property);
        return fromVCardProperties(properties as VCardProperty[]);
    });
};

describe('csv', () => {
    describe('toVCardContacts', () => {
        it('should convert to a vCardContact', () => {
            const contact1: PreVcardsContact = [
                [{ header: 'Given name', value: 'Contact Name', field: 'fn', checked: true } as PreVcardProperty],
                [{ header: 'Email', value: 'contactemail@pm.me', field: 'email', checked: true } as PreVcardProperty],
            ];

            const contact2: PreVcardsContact = [
                [{ header: 'Given name', value: 'Contact Name 2', field: 'fn', checked: true } as PreVcardProperty],
                [{ header: 'Email', value: 'contactemail2@pm.me', field: 'email', checked: true } as PreVcardProperty],
            ];

            const prevCardsContacts: PreVcardsContact[] = [contact1, contact2];

            const expected: VCardContact[] = [
                {
                    fn: [{ field: 'fn', value: 'Contact Name', uid: '' }],
                    email: [{ field: 'email', value: 'contactemail@pm.me', group: 'item1', uid: '' }],
                },
                {
                    fn: [{ field: 'fn', value: 'Contact Name 2', uid: '' }],
                    email: [{ field: 'email', value: 'contactemail2@pm.me', group: 'item1', uid: '' }],
                },
            ];

            const res = excludeFieldsForVerification(toVCardContacts(prevCardsContacts).rest);

            expect(res).toEqual(excludeFieldsForVerification(expected));
        });

        it('should convert to a vCardContact and add email as FN when no FN', () => {
            const contact1: PreVcardsContact = [
                [{ header: 'Email', value: 'contactemail@pm.me', field: 'email', checked: true } as PreVcardProperty],
            ];

            const contact2: PreVcardsContact = [
                [{ header: 'Given name', value: 'Contact Name 2', field: 'fn', checked: true } as PreVcardProperty],
                [{ header: 'Email', value: 'contactemail2@pm.me', field: 'email', checked: true } as PreVcardProperty],
            ];

            const prevCardsContacts: PreVcardsContact[] = [contact1, contact2];

            const expected: VCardContact[] = [
                {
                    fn: [{ field: 'fn', value: 'contactemail@pm.me', uid: '' }],
                    email: [{ field: 'email', value: 'contactemail@pm.me', group: 'item1', uid: '' }],
                },
                {
                    fn: [{ field: 'fn', value: 'Contact Name 2', uid: '' }],
                    email: [{ field: 'email', value: 'contactemail2@pm.me', group: 'item1', uid: '' }],
                },
            ];

            const res = excludeFieldsForVerification(toVCardContacts(prevCardsContacts).rest);

            expect(res).toEqual(excludeFieldsForVerification(expected));
        });

        it('should throw an error when contact has no FN and no email, and import the rest', () => {
            const contact1: PreVcardsContact = [];

            const contact2: PreVcardsContact = [
                [{ header: 'Given name', value: 'Contact Name 2', field: 'fn', checked: true } as PreVcardProperty],
                [{ header: 'Email', value: 'contactemail2@pm.me', field: 'email', checked: true } as PreVcardProperty],
            ];

            const prevCardsContacts: PreVcardsContact[] = [contact1, contact2];

            const expected: VCardContact[] = [
                {
                    fn: [{ field: 'fn', value: 'Contact Name 2', uid: '' }],
                    email: [{ field: 'email', value: 'contactemail2@pm.me', group: 'item1', uid: '' }],
                },
            ];

            const { errors, rest } = toVCardContacts(prevCardsContacts);
            const res = excludeFieldsForVerification(rest);

            expect(res).toEqual(excludeFieldsForVerification(expected));
            expect(errors.length).toEqual(1);
        });
    });
});
