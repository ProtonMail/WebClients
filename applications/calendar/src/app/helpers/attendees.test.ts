import { SimpleMap } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { DisplayNameEmail } from '../containers/calendar/interface';
import { getOrganizerDisplayData } from './attendees';

const generateDummyContactEmail = ({
    email,
    name,
    contactEmailID,
    contactID,
}: {
    email: string;
    name: string;
    contactEmailID: string;
    contactID: string;
}) => {
    const result: ContactEmail = {
        ID: contactEmailID,
        Email: email,
        Name: name,
        Type: [],
        Defaults: 0,
        Order: 0,
        ContactID: contactID,
        LabelIDs: [],
        LastUsedTime: 0,
    };

    return result;
};

describe('getOrganizerDisplayData()', () => {
    const testEmail = 'te_st.E-mail@proton.me';
    const organizer = { email: testEmail, cn: 'The organizer' };
    const isOrganizer = false;

    const contacts = [
        { name: 'Unexpected match', email: testEmail, contactEmailID: '2', contactID: 'unexpected' },
        {
            name: 'Canonicalized match',
            email: 'testemail@proton.me',
            contactEmailID: '3',
            contactID: 'internal',
        },
        { name: 'A gmail match', email: 'te_ste-mail@proton,me', contactEmailID: '4', contactID: 'gmail' },
        { name: 'A lonely contact', email: 'lonely@proton.me', contactEmailID: '5', contactID: 'other' },
        { name: 'Expected match', email: 'te_st.e-mail@proton.me', contactEmailID: '1', contactID: 'expected' },
    ];

    // keys in contactsEmailMap are emails canonicalized with the generic scheme
    const contactsEmailMap = contacts.reduce<SimpleMap<ContactEmail>>((acc, contact) => {
        acc[contact.email] = generateDummyContactEmail(contact);
        return acc;
    }, {});

    // keys in displayNameEmailMap are emails canonicalized by guess. In particular all Proton ones are canonicalized internally
    const displayNameEmailMap: SimpleMap<DisplayNameEmail> = {
        'testemail@proton.me': { displayName: "It's me", displayEmail: 'test.email@proton.me' },
        'lonely@proton.me': { displayName: 'Lone star', displayEmail: 'Lonely@proton.me' },
    };

    test('Distinguishes dots, hyphens and underscores, but not capitalization, to return correct contactId', () => {
        const { contactID } = getOrganizerDisplayData(organizer, isOrganizer, contactsEmailMap, displayNameEmailMap);
        expect(contactID).toEqual('expected');
    });

    test('Neither distinguishes dots, hyphens, underscores or capitalization, to return correct display name', () => {
        const { title, name } = getOrganizerDisplayData(organizer, isOrganizer, contactsEmailMap, displayNameEmailMap);
        expect(name).toEqual("It's me");
        expect(title).toEqual("It's me <te_st.E-mail@proton.me>");
    });

    describe('when user is organiser', () => {
        const isOrganizer = true;

        test('Neither distinguish dots, hyphens, underscores nor capitalization, to return correct display name', () => {
            expect(getOrganizerDisplayData(organizer, isOrganizer, contactsEmailMap, displayNameEmailMap)).toEqual({
                name: 'You',
                title: testEmail,
                contactID: 'expected',
            });
        });
    });
});
